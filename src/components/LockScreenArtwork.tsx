import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';
import { useMemo } from 'react';
import type { LockScreenThemeId } from '@/lib/lockScreenTheme';

interface Props {
  themeId: LockScreenThemeId;
  coverUrl?: string | null;
  title: string;
  songId: string;
  isPlaying: boolean;
}

const COVER_SIZE = 'min(64vw, 260px)';
const THEME_TRANSITION = { duration: 0.85, ease: [0.32, 0.72, 0, 1] as const };

const Cover = ({
  coverUrl,
  title,
  songId,
  rounded,
}: {
  coverUrl?: string | null;
  title: string;
  songId: string;
  rounded: string;
}) => (
  <AnimatePresence mode="popLayout">
    <motion.div
      key={songId}
      className={`absolute inset-0 overflow-hidden ${rounded}`}
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45 }}
    >
      {coverUrl ? (
        <img src={coverUrl} alt={title} className="w-full h-full object-cover" draggable={false} />
      ) : (
        <div className="w-full h-full bg-white/10 flex items-center justify-center">
          <Music className="w-16 h-16 text-white/60" />
        </div>
      )}
    </motion.div>
  </AnimatePresence>
);

const LockScreenArtwork = (props: Props) => {
  return (
    <div className="flex justify-center items-center px-6 mb-2">
      <div className="relative" style={{ width: COVER_SIZE, aspectRatio: '1 / 1' }}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={props.themeId}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.82, rotate: -6, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.12, rotate: 6, filter: 'blur(10px)' }}
            transition={THEME_TRANSITION}
          >
            <ThemeArtwork {...props} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const ThemeArtwork = ({ themeId, coverUrl, title, songId, isPlaying }: Props) => {
  // ───── CLASSIC ─────
  if (themeId === 'classic') {
    return (
      <motion.div
        className="absolute inset-0"
        animate={isPlaying ? { scale: [1, 1.015, 1] } : { scale: 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="absolute inset-0 rounded-[24px] overflow-hidden"
          style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[24px]" />
          {isPlaying && (
            <motion.div
              className="absolute -inset-1/2"
              style={{
                background:
                  'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.18) 50%, transparent 58%)',
              }}
              animate={{ x: ['-40%', '40%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </motion.div>
    );
  }

  // ───── FLUID — morphing blob mask with chromatic rim ─────
  if (themeId === 'fluid') {
    return (
      <div className="absolute inset-0">
        {/* outer iridescent glow */}
        <motion.div
          className="absolute -inset-6 rounded-full blur-3xl opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, #ff2d55, #ff9500, #5e5ce6, #00e5ff, #ff66cc, #ff2d55)',
          }}
          animate={isPlaying ? { rotate: 360 } : {}}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        {/* SVG morphing blob mask */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
          <defs>
            <clipPath id="fluid-blob" clipPathUnits="objectBoundingBox">
              <motion.path
                fill="white"
                animate={
                  isPlaying
                    ? {
                        d: [
                          'M0.5,0.08 C0.72,0.06 0.94,0.28 0.92,0.52 C0.94,0.74 0.74,0.94 0.5,0.92 C0.26,0.94 0.06,0.74 0.08,0.5 C0.06,0.28 0.28,0.1 0.5,0.08 Z',
                          'M0.5,0.05 C0.78,0.1 0.95,0.32 0.9,0.55 C0.92,0.78 0.7,0.96 0.45,0.92 C0.22,0.95 0.05,0.7 0.1,0.48 C0.08,0.22 0.28,0.06 0.5,0.05 Z',
                          'M0.5,0.1 C0.7,0.04 0.96,0.26 0.94,0.52 C0.92,0.76 0.78,0.94 0.5,0.94 C0.22,0.96 0.05,0.72 0.06,0.48 C0.04,0.24 0.32,0.12 0.5,0.1 Z',
                          'M0.5,0.08 C0.72,0.06 0.94,0.28 0.92,0.52 C0.94,0.74 0.74,0.94 0.5,0.92 C0.26,0.94 0.06,0.74 0.08,0.5 C0.06,0.28 0.28,0.1 0.5,0.08 Z',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </clipPath>
          </defs>
        </svg>
        <div
          className="absolute inset-0"
          style={{
            clipPath: 'url(#fluid-blob)',
            WebkitClipPath: 'url(#fluid-blob)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="" />
          {/* color overlays that breathe with the music */}
          <motion.div
            className="absolute inset-0 mix-blend-overlay"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,45,85,0.45), transparent 55%), radial-gradient(circle at 70% 70%, rgba(94,92,230,0.45), transparent 55%)',
            }}
            animate={isPlaying ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.6 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {isPlaying && (
            <motion.div
              className="absolute -inset-1/2"
              style={{
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
              }}
              animate={{ x: ['-40%', '40%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </div>
    );
  }

  // ───── CANVAS — floating cover, depth, parallax tilt, EQ underline ─────
  if (themeId === 'canvas') {
    return (
      <div className="absolute inset-0" style={{ perspective: 1200 }}>
        <motion.div
          className="absolute inset-0 rounded-[28px] overflow-hidden"
          style={{
            boxShadow:
              '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 100px rgba(255,255,255,0.1)',
            transformStyle: 'preserve-3d',
          }}
          animate={
            isPlaying
              ? { rotateY: [-6, 6, -6], rotateX: [3, -3, 3], y: [0, -6, 0] }
              : { rotateY: 0, rotateX: 0, y: 0 }
          }
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[28px]" />
          {/* moving highlight */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 45%)',
            }}
            animate={isPlaying ? { opacity: [0.4, 0.8, 0.4] } : { opacity: 0.5 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* film letterbox bars */}
          <div className="absolute top-0 left-0 right-0 h-[8%] bg-black/85" />
          <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black/85" />
          {/* recording dot */}
          <div className="absolute top-[10%] right-[8%] flex items-center gap-1.5">
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={isPlaying ? { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] } : { opacity: 0.8 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-[8px] font-mono text-white/80 tracking-widest">LIVE</span>
          </div>
          {/* bottom EQ underline */}
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-6">
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-white/80"
                style={{ boxShadow: '0 0 6px rgba(255,255,255,0.6)' }}
                animate={
                  isPlaying ? { height: ['15%', `${30 + ((i * 13) % 70)}%`, '15%'] } : { height: '20%' }
                }
                transition={{ duration: 0.5 + (i % 4) * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.04 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ───── GALAXY — cover as a planet with orbiting moons + ring system ─────
  if (themeId === 'galaxy') {
    const orbits = [
      { size: 7, color: '#ff2d55', duration: 9, delay: 0, glow: 16, radius: 50 },
      { size: 5, color: '#5e5ce6', duration: 13, delay: 0.4, glow: 12, radius: 50 },
      { size: 4, color: '#ffd60a', duration: 17, delay: 0.8, glow: 10, radius: 50 },
      { size: 3, color: '#00e5ff', duration: 22, delay: 1.2, glow: 8, radius: 50 },
    ];
    return (
      <div className="absolute inset-0">
        {/* tilted ring system */}
        <motion.div
          className="absolute inset-[-8%] flex items-center justify-center"
          animate={isPlaying ? { rotate: 360 } : {}}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ transform: 'rotateX(72deg)' }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: '0 0 30px rgba(94,92,230,0.4), inset 0 0 30px rgba(255,45,138,0.25)',
            }}
          />
          <div
            className="absolute w-[88%] h-[88%] rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          />
        </motion.div>

        {/* orbital rings */}
        {orbits.map((o, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: o.duration, repeat: Infinity, ease: 'linear', delay: o.delay }}
            style={{ transformOrigin: '50% 50%' }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: o.size,
                height: o.size,
                background: o.color,
                boxShadow: `0 0 ${o.glow}px ${o.color}, 0 0 ${o.glow * 2}px ${o.color}`,
              }}
            />
            {/* comet trail */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom h-[35%] w-[2px]"
              style={{
                background: `linear-gradient(180deg, transparent, ${o.color}aa)`,
                filter: 'blur(2px)',
                opacity: isPlaying ? 0.7 : 0,
                transform: 'translate(-50%, -100%)',
              }}
            />
          </motion.div>
        ))}

        {/* planet (cover) */}
        <motion.div
          className="absolute inset-[14%] rounded-full overflow-hidden"
          style={{
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.15) inset, 0 0 60px rgba(94,92,230,0.5)',
          }}
          animate={isPlaying ? { scale: [1, 1.04, 1], rotate: [0, 2, 0] } : { scale: 1 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-full" />
          {/* atmospheric rim glow */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 70% 70%, rgba(94,92,230,0.5), transparent 50%)',
            }}
          />
          {/* terminator (day/night line) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(105deg, transparent 50%, rgba(0,0,0,0.45) 80%)',
            }}
          />
        </motion.div>
      </div>
    );
  }

  // ───── VINYL PRO — photoreal record + tonearm + tracking ─────
  if (themeId === 'vinyl') {
    return (
      <div className="absolute inset-0">
        {/* aurora halo */}
        <motion.div
          className="absolute -inset-4 rounded-full opacity-50 blur-2xl"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(255,180,90,0.55), rgba(255,90,40,0.4), rgba(255,180,90,0.55))',
          }}
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        {/* record body */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #0a0a0a 30%, #161616 70%, #050505 100%)',
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 40px rgba(255,140,60,0.2)',
          }}
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
          {/* fine grooves */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
            }}
          />
          {/* coarser groove banding for depth */}
          <div
            className="absolute inset-[8%] rounded-full"
            style={{
              background:
                'repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 0px, transparent 2px, transparent 12px)',
            }}
          />
          {/* center label = cover */}
          <div
            className="absolute inset-[28%] rounded-full overflow-hidden"
            style={{ boxShadow: '0 0 0 4px #1a1a1a, 0 0 0 5px rgba(255,255,255,0.1)' }}
          >
            <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-full" />
          </div>
          {/* spindle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6%] h-[6%] rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <div className="w-[45%] h-[45%] rounded-full bg-zinc-400 shadow-inner" />
          </div>
        </motion.div>

        {/* specular highlight that stays fixed */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.3) 0%, transparent 40%), radial-gradient(ellipse at 80% 85%, rgba(255,200,150,0.18) 0%, transparent 35%)',
          }}
        />

        {/* tonearm */}
        <motion.div
          className="absolute -top-[6%] -right-[6%] w-[60%] h-[60%] origin-top-right pointer-events-none"
          animate={isPlaying ? { rotate: [24, 32, 24] } : { rotate: 6 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* pivot */}
          <div
            className="absolute top-0 right-0 w-5 h-5 rounded-full"
            style={{
              background: 'radial-gradient(circle, #e5e7eb 0%, #71717a 60%, #27272a 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
            }}
          />
          {/* arm */}
          <div
            className="absolute top-2 right-2 w-[85%] h-[4px] rounded-full origin-right"
            style={{
              background: 'linear-gradient(90deg, #d4d4d8, #71717a 70%, #3f3f46)',
              transform: 'rotate(38deg)',
              boxShadow: '0 2px 3px rgba(0,0,0,0.7)',
            }}
          />
          {/* head shell */}
          <div
            className="absolute"
            style={{
              top: '52%',
              right: '12%',
              width: 18,
              height: 10,
              background: 'linear-gradient(180deg, #f4f4f5, #71717a)',
              borderRadius: 2,
              transform: 'rotate(38deg)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.7)',
            }}
          />
        </motion.div>
      </div>
    );
  }

  // ───── NEON STAGE — cover under twin spotlights with reflection ─────
  if (themeId === 'stage') {
    return (
      <div className="absolute inset-0">
        {/* twin spotlight beams */}
        <motion.div
          className="absolute left-1/2 -translate-x-[80%] -top-[60%] w-[140%] h-[160%] origin-bottom"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,234,0,0.0) 0%, rgba(255,234,0,0.5) 70%, rgba(255,45,138,0.6) 100%)',
            clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
          }}
          animate={
            isPlaying ? { rotate: [-10, 10, -10], opacity: [0.7, 1, 0.7] } : { rotate: 0, opacity: 0.6 }
          }
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 translate-x-[-20%] -top-[60%] w-[140%] h-[160%] origin-bottom"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,255,255,0.0) 0%, rgba(0,255,255,0.45) 70%, rgba(94,92,230,0.6) 100%)',
            clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
          }}
          animate={
            isPlaying ? { rotate: [10, -10, 10], opacity: [0.7, 1, 0.7] } : { rotate: 0, opacity: 0.6 }
          }
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* floating cover */}
        <motion.div
          className="absolute inset-0 rounded-[20px] overflow-hidden"
          style={{
            boxShadow:
              '0 0 60px rgba(255,45,138,0.7), 0 0 0 2px rgba(255,255,255,0.25) inset, 0 20px 40px rgba(0,0,0,0.6)',
          }}
          animate={isPlaying ? { y: [0, -8, 0], rotate: [-1, 1, -1] } : { y: 0, rotate: 0 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[20px]" />
          {/* neon rim */}
          <motion.div
            className="absolute inset-0 rounded-[20px] pointer-events-none"
            style={{ boxShadow: '0 0 0 1px rgba(0,255,255,0.5) inset' }}
            animate={isPlaying ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.5 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 3px)',
            }}
          />
        </motion.div>
        {/* reflection */}
        <motion.div
          className="absolute -bottom-[35%] left-0 right-0 h-[45%] rounded-[20px] overflow-hidden opacity-30"
          style={{
            transform: 'scaleY(-1)',
            maskImage: 'linear-gradient(180deg, black 0%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 80%)',
            filter: 'blur(2px)',
          }}
          animate={isPlaying ? { opacity: [0.2, 0.4, 0.2] } : { opacity: 0.25 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[20px]" />
        </motion.div>
      </div>
    );
  }

  return null;
};

export default LockScreenArtwork;
