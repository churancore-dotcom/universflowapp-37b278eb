import { useQuery } from '@tanstack/react-query';
import { getYouTubeMusicNewReleases, searchYouTubeMusicTracks } from '@/lib/musicIndexer';
import type { Song } from '@/contexts/PlayerContext';

/** Convert a YTM IndexedTrack to the app's Song shape. */
function toSong(t: { id: string; title?: string; artist?: string; album?: string; cover_url?: string; audio_url?: string; videoId?: string; duration?: number }): Song | null {
  if (!t.id || !t.title || !t.artist) return null;
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    cover_url: t.cover_url,
    audio_url: t.audio_url || (t.videoId ? `yt-video:${t.videoId}` : `yt-video:${t.id}`),
    duration: t.duration,
  } as Song;
}

export function useYtmRail(key: string, query: string, limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['ytm-rail', key, query, limit],
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<Song[]> => {
      const tracks = await searchYouTubeMusicTracks(query, limit);
      const seen = new Set<string>();
      const out: Song[] = [];
      for (const t of tracks) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        const s = toSong(t);
        if (s) out.push(s);
      }
      return out;
    },
  });
}

export function useYtmNewReleases(country: string, limit = 24, enabled = true) {
  return useQuery({
    queryKey: ['ytm-new-releases', country, limit],
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<Song[]> => {
      const tracks = await getYouTubeMusicNewReleases(country, limit);
      const seen = new Set<string>();
      const out: Song[] = [];
      for (const t of tracks) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        const s = toSong(t);
        if (s) out.push(s);
      }
      return out;
    },
  });
}
