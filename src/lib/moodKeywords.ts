// Mood / genre keyword expansion for YouTube-style search.
// If the user types something like "chill songs" or "sad music", we want to
// detect the underlying mood/genre and fetch matching tracks via Last.fm tag
// charts in addition to the literal text match.

const STOP_WORDS = new Set([
  'songs', 'song', 'music', 'tracks', 'track', 'tunes', 'tune',
  'playlist', 'playlists', 'mix', 'mixes', 'beat', 'beats',
  'vibes', 'vibe', 'mood', 'moods', 'sounds', 'sound',
  'best', 'top', 'good', 'new', 'hits', 'hit',
  'a', 'an', 'the', 'of', 'for', 'and', 'or', 'with',
]);

// Tags Last.fm definitely supports as tag.getTopTracks queries.
const KNOWN_TAGS = new Set([
  'chill', 'chillout', 'lofi', 'lo-fi', 'sad', 'happy', 'romantic', 'love',
  'workout', 'gym', 'party', 'dance', 'edm', 'house', 'techno', 'trance',
  'rock', 'pop', 'rap', 'hip-hop', 'hip hop', 'hiphop', 'trap', 'r&b', 'rnb',
  'jazz', 'blues', 'classical', 'piano', 'guitar', 'acoustic',
  'country', 'folk', 'metal', 'indie', 'alternative', 'punk',
  'soul', 'funk', 'disco', 'reggae', 'latin', 'k-pop', 'kpop',
  'bollywood', 'punjabi', 'hindi', 'arabic', 'spanish',
  'sleep', 'study', 'focus', 'relax', 'relaxing', 'meditation',
  'morning', 'night', 'driving', 'road trip', 'summer', 'winter',
  'breakup', 'heartbreak', 'wedding', 'birthday', 'christmas',
  'energetic', 'motivational', 'instrumental', 'ambient', 'cinematic',
]);

// Synonyms → canonical Last.fm tag
const SYNONYM_MAP: Record<string, string> = {
  'lofi': 'lo-fi',
  'lo fi': 'lo-fi',
  'hiphop': 'hip-hop',
  'hip hop': 'hip-hop',
  'rnb': 'r&b',
  'kpop': 'k-pop',
  'gym': 'workout',
  'studying': 'study',
  'relaxing': 'chill',
  'relax': 'chill',
  'heartbreak': 'sad',
  'breakup': 'sad',
  'romance': 'romantic',
  'love': 'romantic',
};

/**
 * Detect a mood/genre tag from a free-form search query.
 * Returns the canonical Last.fm tag, or null if the query looks like a literal
 * track/artist search.
 */
export function detectMoodTag(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q || q.length > 60) return null;

  // Whole-phrase synonym match first (multi-word like "hip hop")
  for (const [phrase, canonical] of Object.entries(SYNONYM_MAP)) {
    if (q === phrase || q.startsWith(phrase + ' ') || q.endsWith(' ' + phrase) || q.includes(' ' + phrase + ' ')) {
      return canonical;
    }
  }
  for (const tag of KNOWN_TAGS) {
    if (q === tag || q.startsWith(tag + ' ') || q.endsWith(' ' + tag) || q.includes(' ' + tag + ' ')) {
      return tag;
    }
  }

  // Token-based fallback (handles "best chill songs", "sad music")
  const tokens = q.split(/\s+/).filter((t) => t && !STOP_WORDS.has(t));
  for (const tok of tokens) {
    if (SYNONYM_MAP[tok]) return SYNONYM_MAP[tok];
    if (KNOWN_TAGS.has(tok)) return tok;
  }
  return null;
}
