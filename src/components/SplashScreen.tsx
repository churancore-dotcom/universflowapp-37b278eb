import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { iosSpring } from '@/lib/animations';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2200);
      }}
    >
      {/* iOS-style ambient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(211 100% 50% / 0.25), transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [-20, 20, -20],
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(328 100% 54% / 0.2), transparent 70%)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.25, 0.4, 0.25],
            x: [20, -20, 20],
            y: [10, -10, 10],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo - iOS App Icon style */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            ...iosSpring,
            delay: 0.2,
          }}
        >
          <motion.div
            className="w-28 h-28 rounded-[28px] flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(211 100% 50%), hsl(280 100% 60%), hsl(328 100% 54%))',
            }}
            animate={{
              boxShadow: [
                "0 0 30px hsl(211 100% 50% / 0.4)",
                "0 0 60px hsl(211 100% 50% / 0.6), 0 0 100px hsl(328 100% 54% / 0.3)",
                "0 0 30px hsl(211 100% 50% / 0.4)",
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            <Music className="w-14 h-14 text-white relative z-10" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* iOS-style waveform */}
        <motion.div
          className="flex items-center justify-center gap-1 mt-10 h-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...iosSpring, delay: 0.7 }}
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full"
              style={{
                background: `linear-gradient(to top, hsl(211 100% 50%), hsl(328 100% 54%))`,
              }}
              animate={{
                height: [6, 28 + Math.random() * 12, 6],
              }}
              transition={{
                duration: 0.7 + Math.random() * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.08,
              }}
            />
          ))}
        </motion.div>

        {/* Brand name - iOS style */}
        <motion.h1
          className="mt-10 text-4xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...iosSpring, delay: 0.9 }}
        >
          <span className="gradient-text">Sonique</span>
        </motion.h1>

        <motion.p
          className="mt-2 text-muted-foreground text-sm font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Premium Music Experience
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
