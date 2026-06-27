// Admin-only endpoint: hard-deletes a user from auth.users.
// All public.* tables with ON DELETE CASCADE on auth.users(id) clear automatically.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  // Identify caller
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);
  const callerId = userData.user.id;

  // Admin check
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', callerId)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleRow) return json({ error: 'forbidden' }, 403);

  let body: { user_id?: string };
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const targetId = body.user_id;
  if (!targetId || typeof targetId !== 'string') return json({ error: 'user_id required' }, 400);
  if (targetId === callerId) return json({ error: 'cannot delete yourself' }, 400);

  // Best-effort: remove storage objects owned by user (KYC etc.)
  try {
    const buckets = ['artist-kyc', 'avatars', 'covers', 'artist-audio'];
    for (const b of buckets) {
      const { data: list } = await admin.storage.from(b).list(targetId, { limit: 1000 });
      if (list && list.length) {
        await admin.storage.from(b).remove(list.map((f) => `${targetId}/${f.name}`));
      }
    }
  } catch (_) { /* non-blocking */ }

  const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
  const notFound = delErr && /not.?found|no rows|does not exist/i.test(delErr.message);
  if (delErr && !notFound) return json({ error: delErr.message }, 500);

  // Idempotent cleanup: clear public-schema rows even if auth row was already gone.
  // ON DELETE CASCADE handles this when auth.users deletion succeeds; we mirror it
  // manually so "User not found" doesn't leave orphaned profile/artist rows behind.
  await admin.from('artist_profiles').delete().eq('user_id', targetId);
  await admin.from('profiles').delete().eq('user_id', targetId);
  await admin.from('user_roles').delete().eq('user_id', targetId);
  await admin.from('user_subscriptions').delete().eq('user_id', targetId);

  // Audit
  await admin.from('audit_logs').insert({
    event_type: 'admin_delete_user',
    severity: 'warning',
    user_id: callerId,
    details: { deleted_user_id: targetId, auth_user_existed: !notFound },
  });

  return json({ success: true, auth_user_existed: !notFound });
});
