// Returns the visitor's ISO-3166 alpha-2 country code.
// Priority: CDN/edge headers → real IP geo lookup → null.
// No personal data is stored, nothing is logged.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

function pickHeader(h: Headers): string | null {
  const raw =
    h.get('cf-ipcountry') ||
    h.get('x-vercel-ip-country') ||
    h.get('x-country-code') ||
    h.get('x-appengine-country') ||
    h.get('cloudfront-viewer-country') ||
    '';
  return raw.toUpperCase().match(/^[A-Z]{2}$/)?.[0] || null;
}

function clientIp(h: Headers): string | null {
  const xf = h.get('x-forwarded-for') || '';
  const ip = xf.split(',')[0]?.trim() || h.get('x-real-ip') || '';
  if (!ip || ip === '127.0.0.1' || ip.startsWith('::')) return null;
  return ip;
}

async function lookupIp(ip: string): Promise<string | null> {
  // Try multiple free, no-key IP geo providers with short timeouts.
  const providers = [
    `https://ipapi.co/${ip}/country/`,
    `https://api.country.is/${ip}`,
    `https://ipwho.is/${ip}?fields=country_code`,
  ];
  for (const url of providers) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      let cc: string | null = null;
      if (ct.includes('application/json')) {
        const j = await res.json();
        cc = (j?.country || j?.country_code || '').toUpperCase();
      } else {
        cc = (await res.text()).trim().toUpperCase();
      }
      if (/^[A-Z]{2}$/.test(cc || '')) return cc;
    } catch { /* try next */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let cc = pickHeader(req.headers);
  if (!cc) {
    const ip = clientIp(req.headers);
    if (ip) cc = await lookupIp(ip);
  }

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
