// Country-aware query templates for the home feed.
// Spotify-style silent regionalization: a US user sees US trending,
// a Brazilian user sees Brazilian funk/pop, an Indian user sees Bollywood, etc.
// No user-visible "your country" UI — the queries change under the hood.

export interface CountryQuerySet {
  trending: string;
  fresh: string;
  hero: string;
  label: string; // human-readable, only used in cache keys
}

const COUNTRY_QUERIES: Record<string, CountryQuerySet> = {
  IN: {
    trending: 'india top songs this week official music',
    fresh: 'latest hindi punjabi songs official music',
    hero: 'india top songs this week official music',
    label: 'India',
  },
  US: {
    trending: 'usa top songs this week official music',
    fresh: 'new english songs this week official music',
    hero: 'billboard hot 100 this week official',
    label: 'United States',
  },
  GB: {
    trending: 'uk top songs this week official music',
    fresh: 'new uk pop songs this week official music',
    hero: 'uk official chart this week',
    label: 'United Kingdom',
  },
  CA: {
    trending: 'canada top songs this week official music',
    fresh: 'new canadian songs this week official music',
    hero: 'canada hot 100 this week',
    label: 'Canada',
  },
  AU: {
    trending: 'australia top songs this week official music',
    fresh: 'new australian songs this week official music',
    hero: 'aria top 50 this week',
    label: 'Australia',
  },
  BR: {
    trending: 'brasil top musicas semana oficial',
    fresh: 'lancamentos brasileiros funk sertanejo oficial',
    hero: 'top brasil 50 musicas',
    label: 'Brazil',
  },
  MX: {
    trending: 'mexico top canciones esta semana oficial',
    fresh: 'nueva musica latina mexicana oficial',
    hero: 'top mexico 50 canciones',
    label: 'Mexico',
  },
  ES: {
    trending: 'espana top canciones esta semana oficial',
    fresh: 'nueva musica espanol reggaeton oficial',
    hero: 'top espana 50 canciones',
    label: 'Spain',
  },
  DE: {
    trending: 'deutschland top songs woche official music',
    fresh: 'neue deutsche musik official music',
    hero: 'top germany 50 songs',
    label: 'Germany',
  },
  FR: {
    trending: 'france top chansons cette semaine official',
    fresh: 'nouvelle musique francaise rap official',
    hero: 'top france 50 chansons',
    label: 'France',
  },
  IT: {
    trending: 'italia top canzoni questa settimana ufficiale',
    fresh: 'nuova musica italiana ufficiale',
    hero: 'top italia 50 canzoni',
    label: 'Italy',
  },
  NL: {
    trending: 'netherlands top songs this week official',
    fresh: 'new dutch songs official music',
    hero: 'top netherlands 50 songs',
    label: 'Netherlands',
  },
  JP: {
    trending: 'japan top songs this week official music',
    fresh: 'new japanese songs jpop official',
    hero: 'oricon top japan this week',
    label: 'Japan',
  },
  KR: {
    trending: 'korea top songs this week kpop official',
    fresh: 'new kpop songs this week official',
    hero: 'melon top korea this week',
    label: 'Korea',
  },
  ID: {
    trending: 'indonesia top lagu minggu ini official',
    fresh: 'lagu indonesia terbaru official music',
    hero: 'top indonesia 50 lagu',
    label: 'Indonesia',
  },
  PH: {
    trending: 'philippines top songs this week opm official',
    fresh: 'new opm songs official music',
    hero: 'top philippines 50 songs',
    label: 'Philippines',
  },
  PK: {
    trending: 'pakistan top songs this week official music',
    fresh: 'new pakistani songs urdu official',
    hero: 'top pakistan songs this week',
    label: 'Pakistan',
  },
  BD: {
    trending: 'bangladesh top songs this week official',
    fresh: 'new bangla songs official music',
    hero: 'top bangladesh songs this week',
    label: 'Bangladesh',
  },
  NG: {
    trending: 'nigeria top songs this week afrobeats official',
    fresh: 'new naija afrobeats songs official',
    hero: 'top nigeria 50 songs',
    label: 'Nigeria',
  },
  ZA: {
    trending: 'south africa top songs this week amapiano official',
    fresh: 'new amapiano songs official music',
    hero: 'top south africa 50 songs',
    label: 'South Africa',
  },
  AE: {
    trending: 'arabic top songs this week official music',
    fresh: 'new arabic songs official music',
    hero: 'top arab world songs this week',
    label: 'UAE',
  },
  SA: {
    trending: 'arabic khaleeji top songs this week official',
    fresh: 'new arabic khaleeji songs official',
    hero: 'top saudi arabia songs this week',
    label: 'Saudi Arabia',
  },
  TR: {
    trending: 'turkiye en cok dinlenen sarkilar bu hafta official',
    fresh: 'yeni turkce sarkilar official music',
    hero: 'top turkey 50 songs',
    label: 'Turkey',
  },
  RU: {
    trending: 'russia top songs this week official music',
    fresh: 'new russian songs official music',
    hero: 'top russia 50 songs',
    label: 'Russia',
  },
};

const GLOBAL_FALLBACK: CountryQuerySet = {
  trending: 'global top songs this week official music',
  fresh: 'new releases this week official music',
  hero: 'global top 50 this week',
  label: 'Global',
};

export function getCountryQueries(countryCode?: string | null): CountryQuerySet {
  if (!countryCode) return GLOBAL_FALLBACK;
  const cc = countryCode.toUpperCase();
  return COUNTRY_QUERIES[cc] || GLOBAL_FALLBACK;
}
