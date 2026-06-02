import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';
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
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover"
          draggable={false}
        />
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
            initial={{ opacity: 0, scale: 0.82, rotate: -8, filter: 'blur(12px)' }}
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
          style={{
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset',
          }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[24px]" />
          {/* sheen sweep */}
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

  // ───── VINYL: tonearm + grooves + spinning record ─────
  if (themeId === 'vinyl') {
    return (
      <motion.div
        className="absolute inset-0"
        animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* aurora halo */}
        <motion.div
          className="absolute -inset-4 rounded-full opacity-60 blur-2xl"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(255,45,85,0.55), rgba(94,92,230,0.55), rgba(255,149,0,0.55), rgba(255,45,85,0.55))',
          }}
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        {/* record */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset',
            background: '#0a0a0a',
          }}
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          {/* grooves */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 5px)',
            }}
          />
          {/* cover in center */}
          <div className="absolute inset-[22%] rounded-full overflow-hidden">
            <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-full" />
          </div>
          {/* center spindle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[8%] h-[8%] rounded-full bg-black border border-white/20 flex items-center justify-center">
            <div className="w-[40%] h-[40%] rounded-full bg-white/80" />
          </div>
          {/* specular highlight (counter-rotates so it stays put) */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25), rgba(255,255,255,0) 45%)',
            }}
            animate={isPlaying ? { rotate: -360 } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
        {/* tonearm */}
        <motion.div
          className="absolute -top-2 -right-2 w-[55%] h-[55%] origin-top-right pointer-events-none"
          animate={isPlaying ? { rotate: [22, 30, 22] } : { rotate: 8 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 shadow-md" />
          <div
            className="absolute top-2 right-2 w-[78%] h-[3px] rounded-full origin-right"
            style={{
              background: 'linear-gradient(90deg, #e5e7eb, #71717a)',
              transform: 'rotate(38deg)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  // ───── PULSE: cover with EQ bars + concentric pulses ─────
  if (themeId === 'pulse') {
    return (
      <div className="absolute inset-0">
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-[28px] border-2"
            style={{ borderColor: 'rgba(255,45,85,0.5)' }}
            animate={
              isPlaying
                ? { scale: [1, 1.7], opacity: [0.75, 0] }
                : { scale: 1, opacity: 0.2 }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.8,
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 rounded-[24px] overflow-hidden"
          style={{
            boxShadow:
              '0 30px 60px rgba(255,45,85,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 0 80px rgba(255,45,85,0.35)',
          }}
          animate={isPlaying ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[24px]" />
          {/* gradient pulse overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255,45,85,0.35), transparent 60%)',
            }}
            animate={isPlaying ? { opacity: [0.3, 0.7, 0.3] } : { opacity: 0.2 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* EQ bars overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-10">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-white/85"
                style={{ boxShadow: '0 0 6px rgba(255,255,255,0.6)' }}
                animate={
                  isPlaying
                    ? { height: ['10%', `${30 + ((i * 17) % 60)}%`, '10%'] }
                    : { height: '20%' }
                }
                transition={{
                  duration: 0.6 + (i % 4) * 0.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ───── PRISM: cover with chromatic offset + rotating frame ─────
  if (themeId === 'prism') {
    return (
      <div className="absolute inset-0">
        {/* outer glow */}
        <motion.div
          className="absolute -inset-7 rounded-[34px] opacity-70 blur-2xl"
          style={{
            background:
              'conic-gradient(from 0deg, #ff2d55, #5e5ce6, #ff9500, #00e5ff, #ff2d55)',
          }}
          animate={isPlaying ? { rotate: -360 } : { rotate: 0 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        {/* spinning gradient frame */}
        <motion.div
          className="absolute -inset-[6px] rounded-[28px]"
          style={{
            background:
              'conic-gradient(from 0deg, #ff2d55, #5e5ce6, #ff9500, #00e5ff, #ff2d55)',
            filter: 'blur(2px)',
          }}
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div
          className="absolute inset-0 rounded-[24px] overflow-hidden"
          style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.55)' }}
        >
          {/* chromatic aberration layers */}
          {coverUrl && isPlaying && (
            <>
              <motion.img
                src={coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60"
                style={{ filter: 'hue-rotate(-25deg)' }}
                animate={{ x: [-3, 3, -3], y: [2, -2, 2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.img
                src={coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60"
                style={{ filter: 'hue-rotate(25deg)' }}
                animate={{ x: [3, -3, 3], y: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          )}
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[24px]" />
          {/* prism light sweep */}
          {isPlaying && (
            <motion.div
              className="absolute -inset-1/2"
              style={{
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
              }}
              animate={{ x: ['-40%', '40%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </div>
    );
  }

  // ───── ORBIT: planet cover + orbiting moons with trails ─────
  if (themeId === 'orbit') {
    const orbits = [
      { size: 8, color: '#ff2d55', duration: 8, delay: 0, glow: 16 },
      { size: 6, color: '#5e5ce6', duration: 12, delay: 0.4, glow: 12 },
      { size: 5, color: '#ffd60a', duration: 16, delay: 0.8, glow: 10 },
      { size: 4, color: '#00e5ff', duration: 20, delay: 1.2, glow: 8 },
    ];
    return (
      <div className="absolute inset-0">
        {/* orbit rings */}
        {orbits.map((_, i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full border border-white/8"
            style={{
              inset: `${4 - i}%`,
              borderColor: `rgba(255,255,255,${0.06 + i * 0.02})`,
            }}
          />
        ))}
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
            {/* trail */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-bottom h-[40%] w-[2px]"
              style={{
                background: `linear-gradient(180deg, transparent, ${o.color}aa)`,
                filter: 'blur(2px)',
                opacity: isPlaying ? 0.7 : 0,
                transform: 'translate(-50%, -100%)',
              }}
            />
          </motion.div>
        ))}
        {/* planet */}
        <motion.div
          className="absolute inset-[12%] rounded-full overflow-hidden"
          style={{
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.12) inset, 0 0 50px rgba(94,92,230,0.4)',
          }}
          animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-full" />
          {/* atmospheric rim */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 70% 70%, rgba(94,92,230,0.4), transparent 50%)',
            }}
          />
        </motion.div>
      </div>
    );
  }

  // ───── STAGE: cover under spotlight on a stage ─────
  if (themeId === 'stage') {
    return (
      <div className="absolute inset-0">
        {/* twin spotlight beams */}
        <motion.div
          className="absolute left-1/2 -translate-x-[80%] -top-[60%] w-[140%] h-[160%] origin-bottom"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,234,0,0.0) 0%, rgba(255,234,0,0.45) 70%, rgba(255,45,138,0.55) 100%)',
            clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
          }}
          animate={isPlaying ? { rotate: [-8, 8, -8], opacity: [0.7, 1, 0.7] } : { rotate: 0, opacity: 0.6 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 translate-x-[-20%] -top-[60%] w-[140%] h-[160%] origin-bottom"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,255,255,0.0) 0%, rgba(0,255,255,0.4) 70%, rgba(94,92,230,0.55) 100%)',
            clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
          }}
          animate={isPlaying ? { rotate: [8, -8, 8], opacity: [0.7, 1, 0.7] } : { rotate: 0, opacity: 0.6 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* floating cover */}
        <motion.div
          className="absolute inset-0 rounded-[20px] overflow-hidden"
          style={{
            boxShadow:
              '0 0 60px rgba(255,45,138,0.65), 0 0 0 2px rgba(255,255,255,0.2) inset, 0 20px 40px rgba(0,0,0,0.55)',
          }}
          animate={isPlaying ? { y: [0, -8, 0], rotate: [-1, 1, -1] } : { y: 0, rotate: 0 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cover coverUrl={coverUrl} title={title} songId={songId} rounded="rounded-[20px]" />
          {/* neon edge glow */}
          <motion.div
            className="absolute inset-0 rounded-[20px] pointer-events-none"
            style={{ boxShadow: '0 0 0 1px rgba(0,255,255,0.4) inset' }}
            animate={isPlaying ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.5 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          ) : null}
        </motion.div>
      </div>
    );
  }

  return null;
};

export default LockScreenArtwork;
