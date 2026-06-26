// Silent country resolution for feed personalization.
// Priority: profile.country_code → silent edge IP geo → browser locale → 'US'.
// Cached per session so home rails don't flicker between countries.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { detectCountrySilently } from '@/lib/geoCountry';

const SESSION_KEY = 'uf-feed-country';

export function useUserCountry(): string {
  const { user } = useAuth();
  const [country, setCountry] = useState<string>(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached && /^[A-Z]{2}$/.test(cached)) return cached;
    } catch {}
    return '';
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cc: string | null = null;

      if (user?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('country_code')
            .eq('user_id', user.id)
            .maybeSingle();
          const raw = (data?.country_code || '').toUpperCase();
          if (/^[A-Z]{2}$/.test(raw)) cc = raw;
        } catch {}
      }

      if (!cc) {
        try {
          cc = await detectCountrySilently();
        } catch {}
      }

      if (!cc) cc = 'US';
      if (cancelled) return;
      try { sessionStorage.setItem(SESSION_KEY, cc); } catch {}
      setCountry(cc);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return country || 'US';
}
