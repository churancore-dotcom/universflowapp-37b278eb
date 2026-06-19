// Silent country detection — uses the edge CDN IP header (no permission
// prompt, no PII stored). Falls back to the browser locale (e.g. en-IN → IN)
// and finally to 'IN'. Result is cached in sessionStorage so we hit the edge
// at most once per tab.
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'uf-geo-country';

function localeFallback(): string {
  try {
    const locale = (Intl.DateTimeFormat().resolvedOptions().locale || '').toUpperCase();
    const m = locale.match(/-([A-Z]{2})\b/);
    return m?.[1] || 'IN';
  } catch {
    return 'IN';
  }
}

export async function detectCountrySilently(): Promise<string> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached && /^[A-Z]{2}$/.test(cached)) return cached;
  } catch {}

  let cc: string | null = null;
  try {
    const { data } = await supabase.functions.invoke('geo-detect');
    if (data?.country_code && /^[A-Z]{2}$/.test(data.country_code)) {
      cc = data.country_code;
    }
  } catch {
    // edge unavailable — fall back
  }

  const final = cc || localeFallback();
  try { sessionStorage.setItem(CACHE_KEY, final); } catch {}
  return final;
}
