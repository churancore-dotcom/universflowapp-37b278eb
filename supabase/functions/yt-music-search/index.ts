import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  published?: number;
}

async function persistSearchResults(adminClient: any, results: SearchResult[]) {
  if (!results.length) return;
  const now = new Date().toISOString();
  const rows = results.map((track) => ({
    track_id: track.id,
    source: 'indexed',
    title: track.title,
    artist: track.artist,
    cover_url: track.cover_url ?? null,
    audio_url: track.audio_url || `yt-video:${track.videoId}`,
    duration: track.duration ?? null,
    metadata: { provider: 'youtube', videoId: track.videoId },
    last_seen_at: now,
    updated_at: now,
  }));

  const { error } = await adminClient.from('stream_songs').upsert(rows, { onConflict: 'track_id' });
  if (error) console.warn('Unable to cache search results:', error.message);
}

const GENERIC_QUERY_WORDS = new Set([
  'song', 'songs', 'music', 'track', 'tracks', 'latest', 'new', 'fresh', 'official', 'audio', 'video',
  'hindi', 'bollywood', 'punjabi', 'tamil', 'telugu', 'bhojpuri', 'marathi', 'bengali', 'gujarati', 'malayalam', 'kannada', 'urdu',
  'sad', 'love', 'romantic', 'happy', 'party', 'dance', 'lofi', 'lo-fi', 'chill', 'workout', 'gym', 'rap', 'pop', 'rock'
]);

// STRICT spam filter — kills covers, karaoke, sped-up/slowed, AI voice, ringtones, fan edits.
const SPAM_PATTERNS = [
  /\b(top|best)\s*\d+\b/i,
  /\b\d+\s*(top|best|hit|hits|songs)\b/i,
  /\b(non\s*stop|jukebox|mashup|medley|playlist|compilation|collection|mixtape|album full|full album|all songs)\b/i,
  /\b(90'?s|80'?s|70'?s|evergreen|old is gold|purane|old songs?)\b/i,
  /\b(sped\s*up|slowed(\s*\+?\s*reverb)?|nightcore|8\s*d|bass\s*boost(ed)?|reverb)\b/i,
  /\b(karaoke|instrumental|backing\s*track|minus\s*one)\b/i,
  /\b(cover(\s*by)?|cover\s*version|fan\s*made|unofficial|tribute)\b/i,
  /\b(ai\s*cover|ai\s*voice|ai\s*song|deepfake)\b/i,
  /\b(lyric\s*video|with\s*lyrics?|lyrical\s*video|tutorial|reaction|breakdown|analysis)\b/i,
  /\b(whatsapp\s*status|status\s*video|ringtone|alarm\s*tone|caller\s*tune|loop(ed)?)\b/i,
  /\b(tiktok\s*version|reels?\s*version|shorts?|edit\s*audio)\b/i,
  /\b\d+\s*(hour|hours|hr|hrs|minute|minutes|min)\b/i,
  /\b(extended\s*(version|mix)|radio\s*edit|club\s*mix|dance\s*mix)\b/i,
];

// Channels we always drop (low-quality reuploaders / spam farms).
const BANNED_CHANNEL_PATTERNS = [
  /\b(speed\s*songs?|slowed\s*songs?|reverb\s*nation|nightcore\s*mania|karaoke\s*world)\b/i,
  /\b(7\s*clouds|lyrics?\s*vibes?|rap\s*samurai|summervibzz|chill\s*nation|wave\s*music)\b/i,
  /\boriginals?\b/i,
  /\bringtone\s*(king|world|hub)\b/i,
];

const normalize = (value = '') => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function meaningfulTokens(query: string) {
  return normalize(query)
    .split(' ')
    .filter((token) => token.length > 1 && !GENERIC_QUERY_WORDS.has(token));
}

function isLyricQuery(query: string) {
  const raw = query.trim();
  const wordCount = raw.split(/\s+/).filter(Boolean).length;
  return wordCount >= 4 || raw.length >= 25;
}

function parseTitleWithQuery(rawTitle: string, channelTitle: string, query: string) {
  const cleaned = rawTitle
    .replace(/\s*\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\s*\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\s*\(Official\s*Audio\)/gi, '')
    .replace(/\s*\[Official\s*Audio\]/gi, '')
    .replace(/\s*\(Lyrics?\)/gi, '')
    .replace(/\s*\[Lyrics?\]/gi, '')
    .replace(/\s*\|\s*.*$/, '')
    .trim();
  const qTokens = meaningfulTokens(query);
  const dash = cleaned.match(/^(.+?)\s*[-–—]\s+(.+)$/);
  if (!dash) return { artist: channelTitle || 'Unknown Artist', title: cleaned || rawTitle };

  const left = dash[1].trim();
  const right = dash[2].trim();
  const rightNorm = normalize(right);
  const rightHits = qTokens.filter((t) => rightNorm.includes(t)).length;

  // YouTube music uploads overwhelmingly use "Artist - Song". Keep that shape
  // even when the user's query includes the artist name, otherwise searches like
  // "perfect ed sheeran" incorrectly display the title as "Ed Sheeran".
  if (rightHits > 0 || qTokens.length === 0) return { artist: left || channelTitle || 'Unknown Artist', title: right || cleaned };
  return { artist: channelTitle || left || 'Unknown Artist', title: cleaned || rawTitle };
}

function queryMatchesResult(item: any, query: string) {
  if (isLyricQuery(query)) return true;
  const tokens = meaningfulTokens(query);
  if (tokens.length === 0) return true;
  const haystack = normalize(`${String(item?.title || '')} ${String(item?.author || item?.channelTitle || '')}`);

  // STRICT title-first: at least one meaningful token MUST be in the title itself.
  const titleHay = normalize(String(item?.title || ''));
  const titleHits = tokens.filter((t) => titleHay.includes(t)).length;
  if (titleHits === 0) return false;

  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits > 0 && (tokens.length < 2 || hits / tokens.length >= 0.5);
}

function looksSpammy(item: any, query: string) {
  const rawTitle = String(item?.title || '');
  const rawAuthor = String(item?.author || item?.channelTitle || '');
  const haystack = `${rawTitle} ${rawAuthor}`;
  const q = normalize(query);
  const duration = Number(item?.lengthSeconds || item?.duration || 0);

  if (duration && (duration < 75 || duration > 540)) return true;
  if (BANNED_CHANNEL_PATTERNS.some((p) => p.test(rawAuthor))) return true;
  if (SPAM_PATTERNS.some((pattern) => pattern.test(haystack))) return true;
  if (!q.includes('lofi') && /\b(lofi|lo-fi)\b/i.test(haystack)) return true;
  return false;
}

function scoreResult(item: any, query: string, index: number) {
  const title = normalize(String(item?.title || ''));
  const author = normalize(String(item?.author || ''));
  const haystack = `${title} ${author}`;
  const q = normalize(query);
  const tokens = meaningfulTokens(query);
  const duration = Number(item?.lengthSeconds || item?.duration || 0);
  const published = Number(item?.published || 0);
  const ageDays = published > 0 ? Math.max(0, (Date.now() / 1000 - published) / 86400) : 9999;
  const lyric = isLyricQuery(query);
  let score = 100 - index;

  if (!queryMatchesResult(item, query)) return -999;

  if (q && haystack.includes(q)) score += 80;
  // For lyric queries, reward token hits but never penalize misses
  // (lyrics rarely appear in titles — trust provider ranking via 100 - index).
  score += tokens.reduce(
    (sum, token) => sum + (haystack.includes(token) ? 34 : lyric ? 0 : -28),
    0,
  );
  if (/\b(official audio|official video|music video|lyrics?|lyrical)\b/i.test(String(item?.title || ''))) score += 32;
  if (duration >= 120 && duration <= 360) score += 30;
  if (lyric) {
    // De-emphasize recency for lyric searches — user usually wants a specific song,
    // which may be old. Without this, old originals get buried under fresh covers.
    if (ageDays <= 365) score += 15;
  } else {
    if (ageDays <= 90) score += 55;
    else if (ageDays <= 365) score += 30;
    else score -= 80;
  }
  if (looksSpammy(item, query)) score -= 180;
  return score;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Per-user rate limit (30 req/min) to protect YouTube quota
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: allowed } = await adminClient.rpc('check_and_increment_rate_limit', {
      _user_id: userData.user.id,
      _endpoint: 'yt-music-search',
      _max_per_minute: 30,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, limit: requestedLimit } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'A search query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // YouTube Data API search.list has a hard maxResults limit of 50.
    const limit = Math.max(1, Math.min(50, typeof requestedLimit === 'number' ? requestedLimit : 50));
    let sortBy = 'relevance';
    let cleanQuery = query.trim();
    if (cleanQuery.toLowerCase().startsWith('new:')) {
      sortBy = 'upload_date';
      cleanQuery = cleanQuery.slice(4).trim();
    }
    const lyricMode = isLyricQuery(cleanQuery);
    const artistMode = !lyricMode && cleanQuery.split(/\s+/).filter(Boolean).length <= 3;
    const providerQuery = lyricMode
      ? `${cleanQuery} lyrics`
      : artistMode
        ? `${cleanQuery} songs`
        : `${cleanQuery} music`;

    // ---------- Primary: Official YouTube Data API ----------
    const apiKeys = [
      Deno.env.get('YOUTUBE_API_KEY'),
      Deno.env.get('YOUTUBE_API_KEY_2'),
    ].filter(Boolean) as string[];

    let officialData: any = null;
    let officialErr = '';
    if (apiKeys.length > 0) {
      const freshOnlyPasses = lyricMode ? [false] : [false, true];
      for (const freshOnly of freshOnlyPasses) {
        for (const apiKey of apiKeys) {
          const url = new URL('https://www.googleapis.com/youtube/v3/search');
          url.searchParams.set('part', 'snippet');
          url.searchParams.set('q', providerQuery);
          url.searchParams.set('type', 'video');
          url.searchParams.set('videoCategoryId', '10');
          url.searchParams.set('maxResults', String(limit));
          url.searchParams.set('order', sortBy === 'upload_date' ? 'date' : 'relevance');
          if (freshOnly) url.searchParams.set('publishedAfter', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
          url.searchParams.set('key', apiKey);

          const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
          if (response.ok) {
            const candidateData = await response.json();
            const hasMatch = (candidateData.items || []).some((item: any) => queryMatchesResult({ title: item?.snippet?.title, author: item?.snippet?.channelTitle }, cleanQuery));
            if (hasMatch || !freshOnly) {
              officialData = candidateData;
              break;
            }
            officialErr = 'No matching fresh videos';
            continue;
          }
          officialErr = await response.text().catch(() => 'No matching videos');
          console.warn(`YouTube Data API failed (${response.status}), trying next key/window...`, officialErr.slice(0, 200));
        }
        if (officialData) break;
      }
    } else {
      officialErr = 'YouTube Data API keys are not configured';
    }

    if (officialData) {
      const results: SearchResult[] = (officialData.items || [])
        .map((item: any, index: number) => {
          const videoId = item?.id?.videoId;
          if (!videoId) return null;
          const snippet = item.snippet || {};
          const comparable = {
            videoId,
            title: snippet.title || '',
            author: snippet.channelTitle || '',
            published: snippet.publishedAt ? Math.floor(new Date(snippet.publishedAt).getTime() / 1000) : 0,
          };
          if (looksSpammy(comparable, cleanQuery) || scoreResult(comparable, cleanQuery, index) <= -20) return null;
          const parsed = parseTitleWithQuery(snippet.title || 'Unknown Title', snippet.channelTitle || '', cleanQuery);
          return {
            id: `ytm-${videoId}`,
            videoId,
            title: parsed.title,
            artist: parsed.artist,
            audio_url: `yt-video:${videoId}`,
            cover_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
            published: comparable.published || undefined,
          };
        })
        .filter(Boolean);

      if (results.length > 0) {
        await persistSearchResults(adminClient, results);
        return new Response(JSON.stringify({ success: true, results, source: 'youtube-data-api' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      officialErr = 'Official YouTube Data API returned no usable music results after filtering';
    }

    console.warn('Official YouTube Data API returned no usable results:', officialErr.slice(0, 200));
    return new Response(JSON.stringify({ success: false, error: 'YouTube search is temporarily unavailable' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('yt-music-search error:', message);
    return new Response(JSON.stringify({ success: false, error: 'Search is temporarily unavailable' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});