// One-shot admin helper to seed a test artist account.
// Uses the auto-injected SUPABASE_SERVICE_ROLE_KEY to create the auth user,
// then assigns the 'artist' role and creates an approved artist_profile.
//
// Caller must pass the seed token (provided in the request body) — this isn't
// a public endpoint, it's an internal one-shot used by the build agent.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, password, stage_name, seed_token } = await req.json();
    const expected = Deno.env.get('SEED_TEST_ARTIST_TOKEN');
    if (!expected || seed_token !== expected) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Try to create the user. If already exists, look it up.
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { username: stage_name },
    });
    if (createErr && !/already/i.test(createErr.message)) throw createErr;
    if (created?.user) {
      userId = created.user.id;
    } else {
      // Already exists — paginate to find it
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
      if (!userId) throw new Error('User exists but could not be located');
      // Reset password so the requested one always works
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    }

    // Mark email_verified on profile (the prevent trigger allows service_role)
    await admin.from('profiles').update({ email_verified: true, email_verified_at: new Date().toISOString() }).eq('user_id', userId);

    // Grant artist role
    await admin.from('user_roles').upsert(
      { user_id: userId, role: 'artist' as const },
      { onConflict: 'user_id,role' },
    );

    // Build a unique slug
    const baseSlug = (stage_name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'artist';
    let slug = baseSlug;
    for (let i = 1; i < 50; i++) {
      const { data: clash } = await admin.from('artist_profiles').select('id').eq('slug', slug).maybeSingle();
      if (!clash) break;
      // If the existing slug belongs to this user, keep it.
      const { data: mine } = await admin.from('artist_profiles').select('id').eq('user_id', userId).maybeSingle();
      if (mine) { slug = (await admin.from('artist_profiles').select('slug').eq('user_id', userId).single()).data!.slug; break; }
      slug = `${baseSlug}-${i}`;
    }

    // Upsert artist_profile (approved + verified)
    await admin.from('artist_profiles').upsert(
      {
        user_id: userId,
        stage_name,
        slug,
        bio: 'Test artist account for QA — feel free to upload demo tracks.',
        is_verified: true,
        country_code: 'IN',
        social_links: {},
      },
      { onConflict: 'user_id' },
    );

    return new Response(JSON.stringify({ ok: true, user_id: userId, slug }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
