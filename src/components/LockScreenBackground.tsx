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
  // CLASSIC — Ken-burns album art with luminous bloom
  if (themeId === 'classic') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        {coverUrl && (
          <motion.img
            key={coverUrl}
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.25, opacity: 0 }}
            animate={{
              scale: isPlaying ? [1.1, 1.18, 1.1] : 1.1,
              opacity: 1,
              x: isPlaying ? [0, 8, 0, -6, 0] : 0,
              y: isPlaying ? [0, -6, 0, 6, 0] : 0,
            }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
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

  // VINYL — rotating aurora + warm vignette
  if (themeId === 'vinyl') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#070409]">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 backdrop-blur-[100px] bg-black/55" />
        <motion.div
          className="absolute -inset-1/4"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(11,30,63,0.55), rgba(31,122,106,0.5), rgba(184,51,168,0.55), rgba(255,149,0,0.45), rgba(11,30,63,0.55))',
            filter: 'blur(90px)',
            mixBlendMode: 'screen',
          }}
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] rounded-full"
          style={{
            background:
              'radial-gradient(circle, transparent 38%, rgba(255,200,120,0.18) 42%, transparent 60%)',
            filter: 'blur(2px)',
          }}
          animate={isPlaying ? { rotate: -360 } : {}}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" />
      </div>
    );
  }

  // PULSE — heartbeat radial waves + horizontal scanline shimmer
  if (themeId === 'pulse') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#06030f]">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
        )}
        <div className="absolute inset-0 backdrop-blur-[100px] bg-black/60" />
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ borderColor: 'rgba(255,45,85,0.35)', width: '40vw', height: '40vw' }}
            animate={
              isPlaying
                ? { scale: [0.4, 2.6], opacity: [0.7, 0] }
                : { scale: 0.6, opacity: 0.15 }
            }
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeOut', delay: i * 1.2 }}
          />
        ))}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,45,85,0.45) 0%, transparent 55%), radial-gradient(circle at 50% 50%, rgba(94,92,230,0.35) 25%, transparent 70%)',
          }}
          animate={{ opacity: isPlaying ? [0.6, 1, 0.6] : 0.5 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-x-0 h-[200%]"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent 0, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 5px)',
          }}
          animate={isPlaying ? { y: ['-50%', '0%'] } : {}}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      </div>
    );
  }

  // PRISM — floating chromatic orbs + diagonal light sweep
  if (themeId === 'prism') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#06030f]">
        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,45,85,0.75) 0%, transparent 60%)',
            filter: 'blur(70px)',
            top: '-15%',
            left: '-25%',
          }}
          animate={{ x: [0, 140, -40, 0], y: [0, 80, 180, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[70vw] h-[70vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(94,92,230,0.75) 0%, transparent 60%)',
            filter: 'blur(70px)',
            bottom: '-15%',
            right: '-20%',
          }}
          animate={{ x: [0, -120, 50, 0], y: [0, -80, -160, 0], scale: [1, 0.9, 1.15, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,149,0,0.55) 0%, transparent 60%)',
            filter: 'blur(80px)',
            top: '30%',
            left: '20%',
          }}
          animate={{ x: [0, 80, -60, 0], y: [0, -50, 60, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* light sweep */}
        {isPlaying && (
          <motion.div
            className="absolute -inset-1/2"
            style={{
              background:
                'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
            }}
            animate={{ x: ['-30%', '30%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65" />
      </div>
    );
  }

  if (themeId === 'orbit') return <StarfieldBackground isPlaying={isPlaying} />;

  // STAGE — synthwave sunset with sweeping laser beams + parallax grid
  if (themeId === 'stage') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#1b0633] via-[#4a0e6e] to-[#ff2d8a]">
        {/* sun */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-[24%] w-[60vw] h-[60vw] rounded-full"
          style={{
            background:
              'radial-gradient(circle, #ffea00 0%, #ff7a00 45%, #ff2d8a 70%, transparent 82%)',
            filter: 'blur(1px)',
          }}
          animate={{ opacity: isPlaying ? [0.85, 1, 0.85] : 0.9, scale: isPlaying ? [1, 1.04, 1] : 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* sun horizon stripes */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[24%] w-[60vw] h-[60vw] rounded-full"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent 0, transparent 18px, rgba(27,6,51,0.85) 18px, rgba(27,6,51,0.85) 24px)',
            mixBlendMode: 'multiply',
            maskImage: 'linear-gradient(180deg, transparent 50%, black 55%, black 95%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 50%, black 55%, black 95%, transparent 100%)',
          }}
        />
        {/* lasers */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-[55%] origin-top w-[2px] h-[120vh]"
            style={{
              background:
                i === 0
                  ? 'linear-gradient(180deg, rgba(0,255,255,0.9), transparent)'
                  : i === 1
                  ? 'linear-gradient(180deg, rgba(255,45,138,0.9), transparent)'
                  : 'linear-gradient(180deg, rgba(255,234,0,0.9), transparent)',
              boxShadow:
                i === 0
                  ? '0 0 12px rgba(0,255,255,0.7)'
                  : i === 1
                  ? '0 0 12px rgba(255,45,138,0.7)'
                  : '0 0 12px rgba(255,234,0,0.7)',
            }}
            animate={isPlaying ? { rotate: [-35 + i * 12, 35 - i * 12, -35 + i * 12] } : { rotate: 0 }}
            transition={{ duration: 6 + i * 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
        {/* perspective grid */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1/2"
          style={{
            background:
              'linear-gradient(transparent 0%, rgba(255,45,138,0.4) 100%), repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(255,255,255,0.45) 39px, rgba(255,255,255,0.45) 40px), repeating-linear-gradient(0deg, transparent 0, transparent 38px, rgba(0,255,255,0.4) 39px, rgba(0,255,255,0.4) 40px)',
            transform: 'perspective(400px) rotateX(60deg)',
            transformOrigin: 'bottom',
          }}
          animate={isPlaying ? { backgroundPositionY: ['0px', '40px'] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />
      </div>
    );
  }

  return null;
};

const StarfieldBackground = ({ isPlaying }: { isPlaying: boolean }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
      })),
    [],
  );

  const comets = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        top: 10 + i * 25,
        delay: i * 4,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, #2a2563 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #5b2a8c 0%, transparent 50%), #06030f',
        }}
      />
      {/* drifting nebula */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 80%, rgba(255,45,138,0.25), transparent 40%), radial-gradient(circle at 80% 20%, rgba(94,92,230,0.3), transparent 40%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: isPlaying ? [0.6, 1, 0.6] : 0.6 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size * 4}px rgba(255,255,255,0.8)`,
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
      {/* shooting comets */}
      {isPlaying &&
        comets.map((c, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] w-[120px]"
            style={{
              top: `${c.top}%`,
              left: '-15%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
              boxShadow: '0 0 12px rgba(255,255,255,0.8)',
              transform: 'rotate(15deg)',
            }}
            animate={{ x: ['0vw', '130vw'], opacity: [0, 1, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              repeatDelay: 5,
              delay: c.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/65" />
    </div>
  );
};

export default LockScreenBackground;
