import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import OptimizedImage from './OptimizedImage';
import { triggerHaptic } from '@/hooks/useHaptics';
import { readLocalRecent } from '@/lib/localRecentlyPlayed';
import { searchYouTubeMusicTracks } from '@/lib/musicIndexer';
import { supabase } from '@/integrations/supabase/client';

/**
 * Made For You — builds a personalized mix from the user's last ~5 plays.
 * Reads song_ids from localStorage, hydrates artist names from `stream_songs`,
 * then seeds parallel YouTube Music searches and merges the results.
 */
const MadeForYouSection = memo(() => {
  const { user } = useAuth();
  const { playSong, currentSong } = usePlayer();

  const recentIds = useMemo(() => {
    if (!user?.id) return [] as string[];
    return readLocalRecent(user.id).slice(0, 5).map((r) => r.song_id).filter(Boolean);
  }, [user?.id]);

  const { data: mix = [] } = useQuery({
    queryKey: ['ytm-made-for-you', user?.id ?? 'anon', recentIds.join(',')],
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<Song[]> => {
      let seedQueries: string[] = [];
      if (recentIds.length) {
        const { data: rows } = await supabase
          .from('stream_songs')
          .select('artist, title')
          .in('id', recentIds)
          .limit(5);
        const seeds = (rows ?? [])
          .map((r) => (r.artist || r.title || '').trim())
          .filter(Boolean);
        const uniq = [...new Set(seeds)].slice(0, 3);
        seedQueries = uniq.map((s) => `${s} mix`);
      }
      if (!seedQueries.length) seedQueries = ['trending india 2026'];

      const perQuery = Math.max(8, Math.ceil(20 / seedQueries.length));
      const settled = await Promise.allSettled(
        seedQueries.map((q) => searchYouTubeMusicTracks(q, perQuery)),
      );
      const seen = new Set<string>();
      const out: Song[] = [];
      for (const r of settled) {
        if (r.status !== 'fulfilled') continue;
        for (const t of r.value) {
          if (!t.id || seen.has(t.id)) continue;
          if (!t.title || !t.artist) continue;
          seen.add(t.id);
          out.push({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            cover_url: t.cover_url,
            audio_url: t.audio_url || (t.videoId ? `yt-video:${t.videoId}` : 'resolving'),
            duration: t.duration,
          } as Song);
          if (out.length >= 18) break;
        }
        if (out.length >= 18) break;
      }
      return out;
    },
  });

  if (!mix.length) return null;
  const hero = mix[0];
  const rest = mix.slice(1, 7);
  const play = (s: Song) => { triggerHaptic('selection'); playSong(s, undefined, mix); };

  return (
    <section className="mb-2">
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(255,45,85,0.12) 0%, rgba(255,255,255,0.02) 60%)',
          border: '0.5px solid rgba(255,45,85,0.18)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="w-9 h-9 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff2d55, #ffb199)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold tracking-tight text-foreground">Made For You</h2>
            <p className="text-[11px] text-muted-foreground/60 font-medium">Based on what you've been playing</p>
          </div>
        </div>

        <div className="px-3 pb-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => play(hero)}
            className="relative w-full h-44 rounded-3xl overflow-hidden text-left"
            style={{ boxShadow: '0 10px 32px rgba(0,0,0,0.45)' }}
          >
            {hero.cover_url && (
              <OptimizedImage src={hero.cover_url} alt={hero.title} className="absolute inset-0 w-full h-full object-cover scale-110" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-widest text-white uppercase">For You</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-black text-white truncate leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                  {hero.title}
                </p>
                <p className="text-[13px] text-white/75 truncate mt-0.5">{hero.artist}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
              </div>
            </div>
          </motion.button>
        </div>

        <div className="px-2 pb-2">
          {rest.map((song) => {
            const isPlaying = currentSong?.id === song.id;
            return (
              <motion.button
                key={song.id}
                onClick={() => play(song)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-3xl text-left active:bg-white/5"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                  {song.cover_url && <OptimizedImage src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate leading-tight ${isPlaying ? 'text-primary' : 'text-foreground'}`}>{song.title}</p>
                  <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{song.artist}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

MadeForYouSection.displayName = 'MadeForYouSection';
export default MadeForYouSection;
