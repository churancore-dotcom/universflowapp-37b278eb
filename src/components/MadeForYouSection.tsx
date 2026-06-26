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

/**
 * "The Feature" — full-bleed editorial cover spread with a personalized mix.
 * Real YouTube Music data seeded from the user's last ~5 plays.
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
  const rest = mix.slice(1, 5);
  const play = (s: Song) => { triggerHaptic('selection'); playSong(s, undefined, mix); };

  return (
    <section className="mb-2 pt-6">
      {/* Editorial label */}
      <div className="flex items-baseline justify-between border-t border-white/15 pt-3 mb-4 px-1">
        <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">
          The Feature · Issue 01
        </span>
        <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/50 font-semibold">
          Custom&nbsp;Mix
        </span>
      </div>

      {/* Full-bleed cover with overlay copy */}
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={() => play(hero)}
        className="relative w-full aspect-[4/5] overflow-hidden text-left rounded-sm"
        style={{ boxShadow: '0 14px 40px rgba(0,0,0,0.55)' }}
      >
        {hero.cover_url && (
          <OptimizedImage
            src={hero.cover_url}
            alt={hero.title}
            className="absolute inset-0 w-full h-full object-cover scale-110"
          />
        )}
        {/* Editorial top→bottom gradient + film grain feel */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

        {/* Issue badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-foreground text-background px-2 py-1 text-[9px] font-black uppercase tracking-[0.2em]">
            For&nbsp;You
          </span>
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3
            className="text-[40px] leading-[0.92] italic text-foreground tracking-tight mb-3"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            {hero.title}
          </h3>
          <div className="flex items-center justify-between border-t border-white/25 pt-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/80 font-bold truncate pr-3">
              {hero.artist}
            </p>
            <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Track listing under the cover, divided like a contents page */}
      <div className="mt-4 px-1">
        {rest.map((song, idx) => {
          const isPlaying = currentSong?.id === song.id;
          return (
            <button
              key={song.id}
              onClick={() => play(song)}
              className="w-full flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-0 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums w-6">
                  {String(idx + 2).padStart(2, '0')}.
                </span>
                <div className="min-w-0">
                  <p className={`text-[13px] font-semibold truncate leading-tight italic ${isPlaying ? 'text-primary' : 'text-foreground'}`}
                     style={{ fontFamily: "'Playfair Display', serif" }}>
                    {song.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 truncate uppercase tracking-[0.12em] mt-0.5 font-medium">
                    {song.artist}
                  </p>
                </div>
              </div>
              {song.duration ? (
                <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums">
                  {Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
});

MadeForYouSection.displayName = 'MadeForYouSection';
export default MadeForYouSection;
