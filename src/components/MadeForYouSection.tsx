import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import OptimizedImage from './OptimizedImage';
import { triggerHaptic } from '@/hooks/useHaptics';
import { readLocalRecent } from '@/lib/localRecentlyPlayed';
import { searchYouTubeMusicTracks } from '@/lib/musicIndexer';
import { supabase } from '@/integrations/supabase/client';
import { isSpamSong } from '@/pages/Search';

const MadeForYouSection = memo(() => {
  const { user } = useAuth();
  const { playSong, currentSong } = usePlayer();

  const recentIds = useMemo(() => {
    if (!user?.id) return [] as string[];
    return readLocalRecent(user.id).slice(0, 5).map((r) => r.song_id).filter(Boolean);
  }, [user?.id]);

  const { data: mix = [] } = useQuery({
    queryKey: ['ytm-made-for-you-v2', user?.id ?? 'anon', recentIds.join(',')],
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<Song[]> => {
      let seedQueries: string[] = [];
      if (recentIds.length) {
        const { data: rows } = await (supabase as unknown as {
          from: (t: string) => { select: (c: string) => { in: (col: string, vals: string[]) => { limit: (n: number) => Promise<{ data: Array<{ artist: string | null; title: string | null }> | null }> } } };
        })
          .from('stream_songs')
          .select('artist, title')
          .in('id', recentIds)
          .limit(5);
        const seeds = (rows ?? [])
          .map((r) => (r.artist || r.title || '').trim())
          .filter(Boolean);
        const uniq = [...new Set(seeds)].slice(0, 3);
        seedQueries = uniq.map((s) => `${s} official music mix`);
      }
      if (!seedQueries.length) seedQueries = ['india top songs this week official music'];

      const perQuery = Math.max(8, Math.ceil(20 / seedQueries.length));
      const settled = await Promise.allSettled(seedQueries.map((q) => searchYouTubeMusicTracks(q, perQuery)));
      const seen = new Set<string>();
      const out: Song[] = [];
      for (const r of settled) {
        if (r.status !== 'fulfilled') continue;
        for (const t of r.value) {
          if (!t.id || seen.has(t.id) || !t.title || !t.artist) continue;
          const song = {
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            cover_url: t.cover_url,
            audio_url: t.audio_url || (t.videoId ? `yt-video:${t.videoId}` : 'resolving'),
            duration: t.duration,
          } as Song;
          if (isSpamSong(song)) continue;
          seen.add(t.id);
          out.push(song);
          if (out.length >= 18) break;
        }
        if (out.length >= 18) break;
      }
      return out;
    },
  });

  if (!mix.length) return null;
  const hero = mix[0];
  const rest = mix.slice(1, 5);
  const play = (s: Song) => { triggerHaptic('selection'); playSong(s, undefined, mix); };

  return (
    <section className="mb-2 pt-4">
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <h2 className="text-[20px] leading-tight font-extrabold tracking-tight text-foreground">Made For You</h2>
          <p className="text-[11px] text-muted-foreground/55 font-semibold mt-0.5">Based on your listening</p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={() => play(hero)}
        className="relative w-full min-h-[150px] overflow-hidden text-left rounded-3xl border border-white/[0.06] bg-card p-4"
      >
        {hero.cover_url && (
          <OptimizedImage src={hero.cover_url} alt={hero.title} className="absolute right-0 top-0 h-full w-[46%] object-cover opacity-80" eager />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/35" />
        <div className="relative z-10 max-w-[62%]">
          <span className="inline-flex bg-primary text-primary-foreground px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.18em] mb-5">For You</span>
          <h3 className="text-[25px] leading-[1] text-foreground font-extrabold tracking-tight mb-2 line-clamp-2">{hero.title}</h3>
          <p className="text-[12px] text-muted-foreground truncate font-semibold mb-4">{hero.artist}</p>
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
          </div>
        </div>
      </motion.button>

      <div className="mt-2 rounded-3xl border border-white/[0.06] bg-card/60 overflow-hidden">
        {rest.map((song, idx) => {
          const isPlaying = currentSong?.id === song.id;
          return (
            <button key={song.id} onClick={() => play(song)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 border-b border-white/[0.05] last:border-0 text-left active:bg-white/[0.04]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums w-6">{String(idx + 2).padStart(2, '0')}.</span>
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold truncate leading-tight ${isPlaying ? 'text-primary' : 'text-foreground'}`}>{song.title}</p>
                  <p className="text-[10.5px] text-muted-foreground/65 truncate mt-0.5 font-medium">{song.artist}</p>
                </div>
              </div>
              {song.duration ? <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums">{Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
});

MadeForYouSection.displayName = 'MadeForYouSection';
export default MadeForYouSection;