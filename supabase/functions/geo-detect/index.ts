// Returns the visitor's ISO-3166 alpha-2 country code based on the
// edge/CDN IP headers. No personal data is stored, nothing is logged.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const h = req.headers;
  const raw =
    h.get('cf-ipcountry') ||
    h.get('x-vercel-ip-country') ||
    h.get('x-country-code') ||
    h.get('x-appengine-country') ||
    h.get('cloudfront-viewer-country') ||
    '';

  const cc = raw.toUpperCase().match(/^[A-Z]{2}$/)?.[0] || null;

  return new Response(
    JSON.stringify({ country_code: cc, detected_at: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=3600',
      },
    },
  );
});
