// Silent country detection — Spotify-style.
// 1) Edge function (uses CDN country header OR a real IP geo lookup).
// 2) Browser-locale region tag ONLY if it actually contains a region
//    (e.g. "en-IN" → "IN"; bare "en" / "en-US-default" is ignored).
// 3) Empty string → consumers fall back to a Global feed (never forced US).
// Cached per session so we hit the edge at most once per tab.
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'uf-geo-country';

function localeRegion(): string {
  try {
    const navAny = navigator as unknown as { languages?: string[]; language?: string };
    const candidates = [
      ...(navAny.languages || []),
      navAny.language || '',
      Intl.DateTimeFormat().resolvedOptions().locale || '',
    ];
    for (const raw of candidates) {
      const m = raw.toUpperCase().match(/-([A-Z]{2})(?:[-_]|$)/);
      if (m && m[1] !== 'US') return m[1]; // skip the default en-US Android ships with
    }
  } catch { /* noop */ }
  return '';
}

export async function detectCountrySilently(): Promise<string> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached && /^[A-Z]{2}$/.test(cached)) return cached;
  } catch { /* noop */ }

  let cc: string | null = null;
  try {
    const { data } = await supabase.functions.invoke('geo-detect');
    if (data?.country_code && /^[A-Z]{2}$/.test(data.country_code)) {
      cc = data.country_code;
    }
  } catch { /* edge unavailable */ }

  const final = cc || localeRegion() || '';
  if (final) {
    try { sessionStorage.setItem(CACHE_KEY, final); } catch { /* noop */ }
  }
  return final;
}

