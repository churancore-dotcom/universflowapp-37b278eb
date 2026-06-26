import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import OptimizedImage from './OptimizedImage';
import { triggerHaptic } from '@/hooks/useHaptics';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import { rerank } from '@/lib/feedPersonalizer';
import { isSpamSong } from '@/pages/Search';
import { useYtmRail } from '@/lib/ytmRails';

interface Props { songs?: Song[] }

/**
 * "The Index" — editorial trending top-10 list with oversized italic Playfair rank numerals.
 * Magazine-grade aesthetic, real YouTube Music data.
 */
const TrendingNowSection = memo((_props: Props) => {
  const { playSong, currentSong } = usePlayer();
  const taste = useTasteProfile();
  const { data: pool = [] } = useYtmRail('trending', 'trending india 2026', 30);

  const trending = useMemo(() => {
    const clean = pool.filter((s) => !isSpamSong(s));
    return rerank(clean, taste).slice(0, 10);
  }, [pool, taste]);

  if (trending.length === 0) return null;

  return (
    <section className="mb-2 pt-2">
      {/* Editorial section header */}
      <div className="flex items-baseline justify-between border-b border-white/10 pb-2 mb-5 px-1">
        <h2
          className="text-[34px] leading-none text-foreground italic"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
        >
          The Index
        </h2>
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-semibold">
          Trending&nbsp;Now
        </span>
      </div>

      {/* Ranked list */}
      <div className="space-y-0.5">
        {trending.map((song, idx) => {
          const isPlaying = currentSong?.id === song.id;
          const rank = String(idx + 1).padStart(2, '0');
          return (
            <motion.button
              key={song.id}
              onClick={() => { triggerHaptic('selection'); playSong(song, undefined, trending); }}
              whileTap={{ scale: 0.985 }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.025 }}
              className="w-full grid items-center gap-3 px-1 py-3 text-left border-b border-white/[0.04] last:border-0"
              style={{ gridTemplateColumns: '44px 44px 1fr auto' }}
            >
              <span
                className={`text-[32px] leading-none italic tabular-nums select-none ${
                  isPlaying ? 'text-primary' : 'text-white/15'
                }`}
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
              >
                {rank}
              </span>
              <div className="w-11 h-11 rounded-sm overflow-hidden flex-shrink-0 bg-white/5 ring-1 ring-white/10">
                {song.cover_url ? (
                  <OptimizedImage src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className={`text-[13.5px] font-semibold truncate leading-tight tracking-tight ${isPlaying ? 'text-primary' : 'text-foreground'}`}>
                  {song.title}
                </p>
                <p className="text-[10.5px] text-muted-foreground/60 truncate mt-0.5 uppercase tracking-[0.12em] font-medium">
                  {song.artist}
                </p>
              </div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold pl-1">
                Play
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
});

TrendingNowSection.displayName = 'TrendingNowSection';
export default TrendingNowSection;
