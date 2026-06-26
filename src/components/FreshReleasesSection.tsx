import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import OptimizedImage from './OptimizedImage';
import { triggerHaptic } from '@/hooks/useHaptics';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import { rerank } from '@/lib/feedPersonalizer';
import { isSpamSong } from '@/pages/Search';
import { useYtmRail } from '@/lib/ytmRails';

interface Props { songs?: Song[] }

/**
 * "New Releases" — editorial cover spread with a hero drop + contents list.
 * Magazine aesthetic, real YouTube Music new-releases data.
 */
const FreshReleasesSection = memo((_props: Props) => {
  const { playSong } = usePlayer();
  const taste = useTasteProfile();
  const { data: pool = [] } = useYtmRail('fresh', 'new releases 2026', 20);

  const fresh = useMemo(() => {
    const clean = pool.filter((s) => !isSpamSong(s));
    return rerank(clean, taste).slice(0, 6);
  }, [pool, taste]);

  if (fresh.length === 0) return null;
  const hero = fresh[0];
  const rest = fresh.slice(1);
  const play = (s: Song) => { triggerHaptic('selection'); playSong(s, undefined, fresh); };

  return (
    <section className="mb-2 pt-6">
      <div className="flex items-baseline justify-between border-t border-white/15 pt-3 mb-4 px-1">
        <h2
          className="text-[28px] leading-none italic text-foreground tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
        >
          New Releases
        </h2>
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-semibold">
          Just Dropped
        </span>
      </div>

      {/* Hero cover */}
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={() => play(hero)}
        className="relative w-full aspect-[16/10] overflow-hidden text-left rounded-sm"
        style={{ boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}
      >
        {hero.cover_url && (
          <OptimizedImage src={hero.cover_url} alt={hero.title} className="absolute inset-0 w-full h-full object-cover scale-110" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

        <div className="absolute top-3 left-3">
          <span className="bg-foreground text-background px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]">
            New
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p
            className="text-[26px] leading-[0.95] italic text-foreground tracking-tight mb-2 line-clamp-2"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {hero.title}
          </p>
          <div className="flex items-center justify-between border-t border-white/25 pt-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/80 font-bold truncate pr-3">
              {hero.artist}
            </p>
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
              <Play className="w-3.5 h-3.5 text-background ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Contents list */}
      <div className="mt-3 px-1">
        {rest.map((song, idx) => (
          <motion.button
            key={song.id}
            onClick={() => play(song)}
            whileTap={{ scale: 0.985 }}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.03 }}
            className="w-full flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-0 text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums w-6">
                {String(idx + 2).padStart(2, '0')}.
              </span>
              <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0 bg-white/5 ring-1 ring-white/10">
                {song.cover_url && <OptimizedImage src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate leading-tight italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {song.title}
                </p>
                <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5 uppercase tracking-[0.14em] font-medium">
                  {song.artist}
                </p>
              </div>
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-primary/80 font-bold flex-shrink-0">
              New
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
});

FreshReleasesSection.displayName = 'FreshReleasesSection';
export default FreshReleasesSection;
