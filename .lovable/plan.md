# YouTube Music–Backed Search, Home & Player

Goal: every track the user sees and hears comes from `yt-music-search` + `extract-audio`. No mock/seeded catalog. UI stays identical.

## Part 1 — Search (already mostly wired)

`src/pages/Search.tsx` already calls `yt-music-search` and renders title/artist/thumbnail/duration. Changes:
- Remove residual fallbacks to JioSaavn / `stream_songs` / `chart_tracks` lookups inside the Songs tab so results are 100% YouTube Music.
- Keep the "Artists" tab unchanged (verified Universflow profiles + Last.fm).

## Part 2 — Play any result

Tap handler resolves audio through one path:
1. Look up `localStorage` cache for `ytm:stream:<videoId>`.
2. If miss → `supabase.functions.invoke('extract-audio', { body: { videoId } })`.
3. Pass `{ id: videoId, title, artist, cover_url, audio_url, duration }` to `PlayerContext.playSong()` — same shape it already accepts.

Mini-player and full-player already read `currentSong.{title,artist,cover_url}`, no UI changes.

## Part 3 — Purge mock data

DB state today: `songs=0`, `artist_songs=5` (real uploads, keep), `stream_songs=2714` (cache, keep — it's the URL cache), `chart_tracks=1700` (auto-aggregated, but UI now ignores).

Code changes:
- `HomeBento`, `GlobalTopTracksSection`, `PremiumFirstSection`, `FollowedArtistSongsSection`, `ChartSection`, `FreshReleasesSection`, `TrendingNowSection`, `AllSongsSection` — stop reading `songs` / `stream_songs` / `chart_tracks` as a content source. They become thin wrappers around the new YTM rail hook (Part 6).
- `Home.tsx` `HOME_SONGS_QUERY_KEY` query that pulls from `songs` is removed.
- `artist_songs` (real Universflow uploads) keep their dedicated rail.

`stream_songs` table is *retained* — it's the persistent stream URL cache shared with the new 6h client cache.

## Part 4 — 6h client cache

New helper `src/lib/ytmStreamCache.ts`:
```ts
get(videoId) → { url, expiresAt } | null   // returns null if older than 6h
set(videoId, url)                          // stores { url, ts: Date.now() }
invalidate(videoId)
```
Storage key namespace `ytm:stream:v1:<videoId>`. TTL = 6 * 60 * 60 * 1000.

## Part 5 — Error handling & retry

In `PlayerContext.playSong()` (audio element error / 403 / 410 path):
1. On `audio.onerror` or HTTP failure, `invalidate(videoId)` and re-invoke `extract-audio` once.
2. While resolving, set existing `isLoading` flag so the player shows its current spinner.
3. If second attempt fails → toast "Couldn't load this track" and skip to next.

## Part 6 — Home rails from YTM

New hook `src/hooks/useYtmRail.ts`:
- `useYtmRail(query, { ttlMinutes: 60 })` → React Query wrapper around `yt-music-search`.
- Localstorage-backed cache key `ytm:rail:v1:<query>` for instant paint.

Rails:
| Section | Query |
|---|---|
| Trending Now | `trending india 2026` |
| New Releases | `new releases 2026` |
| Top Charts | `top charts india` |
| Made For You | derived: take last-5 from `recently_played` → query = `${artist} ${title} mix` round-robin, dedupe |

Component edits (data swap only, no markup changes):
- `HomeBento.tsx`, `TrendingNowSection.tsx`, `FreshReleasesSection.tsx`, `ChartSection.tsx`, `GlobalTopTracksSection.tsx`, `PremiumFirstSection.tsx`, new `MadeForYouSection.tsx` (replaces personalized rail if one exists).

`feedPersonalizer.ts` reranking still applies on top of the YTM rails.

## Technical details

- All edge function calls go through the existing `supabase.functions.invoke` client (auth + CORS already set).
- `extract-audio` already returns `{ audio_url, expires_in? }` — we ignore server TTL and enforce client 6h cap.
- Make-For-You falls back to `trending india 2026` for users with empty `recently_played`.
- Cache writes are wrapped in `try/catch` for Safari private-mode quota errors.
- Bump `SEARCH_CACHE_NAMESPACE` once more so old JioSaavn-mixed results are evicted.

## Out of scope

- No UI/visual changes.
- No changes to artist upload flow, library, downloads, premium, or admin.
- `chart_tracks` table left in place (used by admin analytics) — just no longer surfaced on Home.
