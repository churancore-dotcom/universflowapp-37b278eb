// AudD.io song recognition proxy.
// Receives an audio blob from the client, forwards to AudD, returns match.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const AUDD_TOKEN = Deno.env.get('AUDD_API_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ALLOWED_ORIGINS = new Set([
  'https://universflow.in',
  'https://www.universflow.in',
  'https://universflowapp.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
  'capacitor://localhost',
  'https://localhost',
]);

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://universflow.in',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

interface AuddResult {
  artist?: string;
  title?: string;
  album?: string;
  release_date?: string;
  song_link?: string;
  spotify?: { album?: { images?: Array<{ url: string }> } };
  apple_music?: { artwork?: { url: string } };
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!AUDD_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'AUDD_API_TOKEN is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData?.user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authentication' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: allowed } = await adminClient.rpc('check_and_increment_rate_limit', {
    _user_id: userData.user.id,
    _endpoint: 'recognize-song',
    _max_per_minute: 8,
  });
  if (allowed === false) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } },
    );
  }

  try {
    const incoming = await req.formData();
    const file = incoming.get('file');
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: 'Missing "file" field with audio recording' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const size = (file as Blob).size ?? 0;
    if (size < 2048) {
      return new Response(
        JSON.stringify({ error: 'Recording is too short. Please record at least 4 seconds.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (size > 8 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Recording is too large (max 8MB).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const fd = new FormData();
    fd.append('api_token', AUDD_TOKEN);
    fd.append('file', file as Blob, 'sample.webm');
    fd.append('return', 'apple_music,spotify');

    const res = await fetch('https://api.audd.io/', { method: 'POST', body: fd });
    const data = await res.json().catch(() => null) as { status?: string; result?: AuddResult | null; error?: { error_message?: string } } | null;

    if (!data || data.status !== 'success') {
      const msg = data?.error?.error_message ?? 'Recognition service error';
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!data.result) {
      return new Response(
        JSON.stringify({ match: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const r = data.result;
    const cover =
      r.apple_music?.artwork?.url?.replace('{w}', '600').replace('{h}', '600') ??
      r.spotify?.album?.images?.[0]?.url ??
      null;

    return new Response(
      JSON.stringify({
        match: {
          title: r.title ?? null,
          artist: r.artist ?? null,
          album: r.album ?? null,
          releaseDate: r.release_date ?? null,
          songLink: r.song_link ?? null,
          cover,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
