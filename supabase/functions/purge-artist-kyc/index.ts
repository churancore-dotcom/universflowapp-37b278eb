// Deletes KYC files (id docs + selfie) from the artist-kyc bucket once an
// application is approved/rejected. Called by a Postgres AFTER UPDATE trigger
// via pg_net. Authentication is a timing-safe shared secret stored in
// public.internal_secrets (kyc_purge_token) — never the service-role JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { system_token?: string; paths?: string[]; application_id?: string };
  try { body = await req.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: secret } = await admin
    .from('internal_secrets')
    .select('value')
    .eq('key', 'kyc_purge_token')
    .maybeSingle();

  const expected = (secret?.value ?? '').toString().replace(/^"|"$/g, '');
  if (!expected || !body.system_token || !safeEqual(body.system_token, expected)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const paths = (body.paths ?? [])
    .filter((p): p is string => typeof p === 'string' && p.length > 0 && p.length < 512);

  if (paths.length === 0) return json({ deleted: 0 });

  const { data: removed, error } = await admin.storage.from('artist-kyc').remove(paths);
  if (error) return json({ error: error.message }, 500);

  return json({ deleted: removed?.length ?? 0, paths: removed?.map((r) => r.name) ?? [] });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
