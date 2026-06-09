import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

// Splash: original logo-anim.mp4 video — restored — with a fresher cinematic frame
// around it (rose halo, ring stroke, animated underline) so it doesn't feel stale.
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    // Hard cap so we never block the app even if video fails to load
    const fallback = setTimeout(onComplete, 3500);
    return () => clearTimeout(fallback);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: '#050507' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Ambient rose halo */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255,45,85,0.22), rgba(255,45,85,0.05) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Animated ring stroke around the video */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-48 h-48 rounded-full flex items-center justify-center"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(255,45,85,0.6), rgba(255,45,85,0) 60%, rgba(255,45,85,0.6))',
            padding: 2,
          }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black"
            style={{ boxShadow: '0 20px 60px rgba(255,45,85,0.25)' }}
          >
            <video
              ref={videoRef}
              src="/logo-anim.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setVideoReady(true)}
              onEnded={onComplete}
              onError={onComplete}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <motion.h1
          className="mt-7 text-3xl font-semibold tracking-tight text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Universflow
        </motion.h1>

        {/* Shimmer underline */}
        <motion.div
          className="mt-5 h-[2px] w-24 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div
            className="h-full w-1/2"
            style={{
              background: 'linear-gradient(90deg, transparent, #FF2D55, transparent)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.button
          onClick={onComplete}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-8 text-[11px] uppercase tracking-[0.25em] text-white/40 active:scale-95 transition-transform"
        >
          Skip →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
