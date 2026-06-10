import { useEffect } from 'react';
import { motion } from 'framer-motion';
import appLogo from '@/assets/app-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Instant splash — pure CSS/image, no video, no network wait.
 * Renders on the very first paint and dismisses after 450ms so the
 * APK shell never blocks behind a loading splash.
 */
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 450);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="w-28 h-28 rounded-[28px] overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #1a1a1c 0%, #0a0a0b 100%)',
            boxShadow: '0 0 48px hsl(var(--primary) / 0.28), inset 0 0 0 0.5px rgba(255,255,255,0.08)',
          }}
        >
          <img
            src={appLogo}
            alt="Universflow"
            width={112}
            height={112}
            decoding="sync"
            fetchPriority="high"
            className="w-full h-full object-cover scale-[1.18]"
          />
        </div>
        <div className="text-center">
          <h1 className="text-[26px] leading-none font-black tracking-[0.08em] text-foreground">
            Univers <span className="text-primary">Flow</span>
          </h1>
          <div className="mt-3 h-[2px] w-24 mx-auto rounded-full uf-rose-gradient opacity-90" />
        </div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
