import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import type { LockScreenThemeId } from '@/lib/lockScreenTheme';

interface Props {
  themeId: LockScreenThemeId;
  coverUrl?: string | null;
  isPlaying: boolean;
}

const THEME_TRANSITION = { duration: 0.9, ease: [0.32, 0.72, 0, 1] as const };

const LockScreenBackground = ({ themeId, coverUrl, isPlaying }: Props) => {
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={themeId}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.08, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.96, filter: 'blur(14px)' }}
        transition={THEME_TRANSITION}
      >
        <ThemeBackground themeId={themeId} coverUrl={coverUrl} isPlaying={isPlaying} />
      </motion.div>
    </AnimatePresence>
  );
};

const ThemeBackground = ({ themeId, coverUrl, isPlaying }: Props) => {
  // ───── CLASSIC (free) — blurred art + subtle bloom ─────
  if (themeId === 'classic') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        {coverUrl && (
          <motion.img
            key={coverUrl}
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{
              scale: isPlaying ? [1.1, 1.16, 1.1] : 1.1,
              opacity: 1,
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="absolute inset-0 backdrop-blur-[90px] bg-black/55" />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.10), transparent 60%)',
          }}
          animate={isPlaying ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.5 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/75" />
      </div>
    );
  }

  // ───── FLUID — SVG metaballs morphing + color extraction ─────
  if (themeId === 'fluid') return <FluidBackground coverUrl={coverUrl} isPlaying={isPlaying} />;

  // ───── CANVAS — full-bleed cinematic, Ken Burns + parallax tilt ─────
  if (themeId === 'canvas') return <CanvasBackground coverUrl={coverUrl} isPlaying={isPlaying} />;

  // ───── GALAXY — parallax depth particles + audio-reactive nebula ─────
  if (themeId === 'galaxy') return <GalaxyBackground isPlaying={isPlaying} />;

  // ───── VINYL PRO — warm wood + spotlight ─────
  if (themeId === 'vinyl') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0a0606]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(255,180,90,0.25), transparent 55%), radial-gradient(circle at 50% 100%, rgba(60,20,10,0.9), #0a0606 70%)',
          }}
        />
        {/* warm wood grain */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(180,80,40,0.5) 0px, transparent 2px, transparent 70px, rgba(120,60,30,0.4) 72px), repeating-linear-gradient(0deg, transparent 0px, transparent 100px, rgba(80,40,20,0.3) 101px)',
          }}
        />
        {/* spotlight cone from top */}
        <motion.div
          className="absolute left-1/2 -top-[20%] w-[120%] h-[80%] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(255,220,150,0.35) 0%, transparent 60%)',
          }}
          animate={isPlaying ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.7 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* dust motes */}
        <DustMotes count={20} active={isPlaying} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/85" />
      </div>
    );
  }

  // ───── NEON STAGE — synthwave grid + sweeping lasers ─────
  if (themeId === 'stage') return <StageBackground isPlaying={isPlaying} />;

  return null;
};

// ════════════════════════════════════════════════════════════
// FLUID — SVG metaballs (Apple Music style)
// ════════════════════════════════════════════════════════════
const FluidBackground = ({ coverUrl, isPlaying }: { coverUrl?: string | null; isPlaying: boolean }) => {
  const blobs = useMemo(
    () => [
      { color: '#ff2d55', size: 360, x: '20%', y: '25%', dur: 14, ax: 40, ay: 60 },
      { color: '#5e5ce6', size: 320, x: '70%', y: '35%', dur: 17, ax: -50, ay: 70 },
      { color: '#ff9500', size: 300, x: '40%', y: '70%', dur: 20, ax: 60, ay: -40 },
      { color: '#00e5ff', size: 280, x: '80%', y: '75%', dur: 23, ax: -40, ay: -60 },
      { color: '#ff66cc', size: 260, x: '15%', y: '80%', dur: 26, ax: 50, ay: -30 },
    ],
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#06030f]">
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}
      <div className="absolute inset-0 backdrop-blur-[80px] bg-black/45" />

      {/* metaball stack — filter creates the gooey morph */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <filter id="goo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
            <feColorMatrix
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 22 -11"
            />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0" style={{ filter: 'url(#goo) blur(2px)', mixBlendMode: 'screen' }}>
        {blobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: b.x,
              top: b.y,
              background: `radial-gradient(circle, ${b.color} 0%, ${b.color}aa 40%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={
              isPlaying
                ? {
                    x: [0, b.ax, -b.ax * 0.5, 0],
                    y: [0, b.ay, -b.ay * 0.5, 0],
                    scale: [1, 1.15, 0.92, 1],
                  }
                : { x: 0, y: 0, scale: 1 }
            }
            transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* subtle audio-reactive vignette */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 60%, transparent 30%, rgba(0,0,0,0.55) 100%)' }}
        animate={isPlaying ? { opacity: [0.85, 1, 0.85] } : { opacity: 0.9 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// CANVAS — Spotify-Canvas-style full-bleed cover
// ════════════════════════════════════════════════════════════
const CanvasBackground = ({ coverUrl, isPlaying }: { coverUrl?: string | null; isPlaying: boolean }) => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {coverUrl ? (
        <>
          {/* Layer 1: deep parallax (slow Ken Burns) */}
          <motion.img
            src={coverUrl}
            alt=""
            className="absolute inset-[-15%] w-[130%] h-[130%] object-cover"
            animate={
              isPlaying
                ? { scale: [1, 1.18, 1.08, 1], x: [0, -30, 20, 0], y: [0, -25, 15, 0] }
                : { scale: 1.05 }
            }
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Layer 2: brighter highlight pass with hue shift */}
          <motion.img
            src={coverUrl}
            alt=""
            className="absolute inset-[-10%] w-[120%] h-[120%] object-cover mix-blend-screen opacity-40"
            style={{ filter: 'saturate(1.4) hue-rotate(15deg) blur(2px)' }}
            animate={isPlaying ? { scale: [1.05, 1.12, 1.05], rotate: [0, 1.5, 0] } : { scale: 1.05 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a1a5a] to-[#06030f]" />
      )}
      {/* film grain shimmer */}
      <motion.div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          background:
            'repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 3px)',
        }}
        animate={isPlaying ? { opacity: [0.05, 0.12, 0.05] } : { opacity: 0.07 }}
        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
      />
      {/* cinematic letterbox vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 60%, rgba(0,0,0,0.9) 100%)',
        }}
      />
      {/* light leak */}
      <motion.div
        className="absolute -inset-1/4"
        style={{
          background:
            'linear-gradient(120deg, transparent 35%, rgba(255,180,120,0.18) 50%, transparent 65%)',
        }}
        animate={isPlaying ? { x: ['-25%', '25%'] } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// GALAXY — 3 parallax star layers + audio-reactive nebula
// ════════════════════════════════════════════════════════════
const GalaxyBackground = ({ isPlaying }: { isPlaying: boolean }) => {
  const layers = useMemo(
    () =>
      [40, 60, 90].map((n, depth) =>
        Array.from({ length: n }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: (depth + 1) * 0.6 + Math.random() * 1.2,
          delay: Math.random() * 4,
          duration: 2 + Math.random() * 3,
        })),
      ),
    [],
  );

  const comets = useMemo(
    () => Array.from({ length: 3 }, (_, i) => ({ top: 12 + i * 26, delay: i * 5 })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#04020c]">
      {/* deep nebula */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 25% 25%, #2a2563 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, #5b2a8c 0%, transparent 55%), radial-gradient(circle at 50% 50%, #1a0a3a 0%, transparent 60%)',
        }}
        animate={isPlaying ? { opacity: [0.85, 1, 0.85] } : { opacity: 0.9 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* audio-reactive color clouds */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 80%, rgba(255,45,138,0.35), transparent 35%), radial-gradient(circle at 80% 20%, rgba(94,92,230,0.4), transparent 35%), radial-gradient(circle at 50% 50%, rgba(0,229,255,0.18), transparent 40%)',
          filter: 'blur(50px)',
        }}
        animate={
          isPlaying
            ? { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
            : { scale: 1, opacity: 0.8 }
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 3 parallax star layers */}
      {layers.map((stars, depth) => (
        <motion.div
          key={depth}
          className="absolute inset-0"
          animate={isPlaying ? { x: [0, (depth + 1) * 8, 0], y: [0, (depth + 1) * -4, 0] } : {}}
          transition={{ duration: 20 + depth * 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {stars.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                boxShadow: `0 0 ${s.size * 4}px rgba(255,255,255,0.85)`,
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: isPlaying ? s.duration : s.duration * 2,
                repeat: Infinity,
                delay: s.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      ))}
      {/* shooting comets */}
      {isPlaying &&
        comets.map((c, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] w-[140px]"
            style={{
              top: `${c.top}%`,
              left: '-20%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
              boxShadow: '0 0 14px rgba(255,255,255,0.85)',
              transform: 'rotate(15deg)',
            }}
            animate={{ x: ['0vw', '130vw'], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 6, delay: c.delay, ease: 'easeOut' }}
          />
        ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// STAGE — synthwave sunset + perspective grid + lasers + fog
// ════════════════════════════════════════════════════════════
const StageBackground = ({ isPlaying }: { isPlaying: boolean }) => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#1b0633] via-[#4a0e6e] to-[#ff2d8a]">
      {/* sun */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-[20%] w-[65vw] h-[65vw] rounded-full"
        style={{
          background:
            'radial-gradient(circle, #ffea00 0%, #ff7a00 45%, #ff2d8a 70%, transparent 82%)',
          filter: 'blur(1px)',
        }}
        animate={{ opacity: isPlaying ? [0.85, 1, 0.85] : 0.9, scale: isPlaying ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* sun horizon stripes */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[20%] w-[65vw] h-[65vw] rounded-full"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0, transparent 18px, rgba(27,6,51,0.85) 18px, rgba(27,6,51,0.85) 24px)',
          mixBlendMode: 'multiply',
          maskImage: 'linear-gradient(180deg, transparent 50%, black 55%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 50%, black 55%, black 95%, transparent 100%)',
        }}
      />
      {/* swinging lasers */}
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-[55%] origin-top w-[2px] h-[120vh]"
          style={{
            background:
              i === 0
                ? 'linear-gradient(180deg, rgba(0,255,255,0.95), transparent)'
                : i === 1
                ? 'linear-gradient(180deg, rgba(255,45,138,0.95), transparent)'
                : i === 2
                ? 'linear-gradient(180deg, rgba(255,234,0,0.95), transparent)'
                : 'linear-gradient(180deg, rgba(180,90,255,0.95), transparent)',
            boxShadow:
              i === 0
                ? '0 0 14px rgba(0,255,255,0.8)'
                : i === 1
                ? '0 0 14px rgba(255,45,138,0.8)'
                : i === 2
                ? '0 0 14px rgba(255,234,0,0.8)'
                : '0 0 14px rgba(180,90,255,0.8)',
          }}
          animate={
            isPlaying ? { rotate: [-40 + i * 14, 40 - i * 14, -40 + i * 14] } : { rotate: 0 }
          }
          transition={{ duration: 5 + i * 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}
      {/* perspective grid */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background:
            'linear-gradient(transparent 0%, rgba(255,45,138,0.45) 100%), repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(0deg, transparent 0, transparent 38px, rgba(0,255,255,0.45) 39px, rgba(0,255,255,0.45) 40px)',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }}
        animate={isPlaying ? { backgroundPositionY: ['0px', '40px'] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
      />
      {/* drifting fog */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[35%]"
        style={{
          background:
            'radial-gradient(ellipse at 30% 100%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(255,200,230,0.25), transparent 60%)',
          filter: 'blur(20px)',
        }}
        animate={isPlaying ? { x: [-20, 20, -20], opacity: [0.7, 1, 0.7] } : { opacity: 0.6 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />
    </div>
  );
};

const DustMotes = ({ count, active }: { count: number; active: boolean }) => {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        dur: 8 + Math.random() * 10,
        delay: Math.random() * 4,
      })),
    [count],
  );
  return (
    <>
      {motes.map((m, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-amber-100/60"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            boxShadow: `0 0 ${m.size * 3}px rgba(255,220,150,0.7)`,
          }}
          animate={active ? { y: [-20, 20, -20], opacity: [0.2, 0.9, 0.2] } : { opacity: 0.3 }}
          transition={{ duration: m.dur, repeat: Infinity, delay: m.delay, ease: 'easeInOut' }}
        />
      ))}
    </>
  );
};

export default LockScreenBackground;
