import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
  skipDelay?: number; // seconds before skip button appears
}

const InterstitialAd = memo(function InterstitialAd({ 
  isOpen, 
  onClose, 
  onSkip,
  skipDelay = 5 
}: InterstitialAdProps) {
  const { isPremium } = usePremium();
  const [canSkip, setCanSkip] = useState(false);
  const [countdown, setCountdown] = useState(skipDelay);

  useEffect(() => {
    if (!isOpen) {
      setCanSkip(false);
      setCountdown(skipDelay);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, skipDelay]);

  // Don't show ads to premium users
  if (isPremium) {
    if (isOpen) onClose();
    return null;
  }

  const handleSkip = () => {
    if (canSkip) {
      onSkip?.();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
        >
          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleSkip}
            disabled={!canSkip}
            className={`
              absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full
              ${canSkip 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-white/10 cursor-not-allowed'
              }
              transition-colors
            `}
          >
            {canSkip ? (
              <>
                <X className="w-4 h-4" />
                <span className="text-sm">Skip</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Skip in {countdown}s</span>
            )}
          </motion.button>

          {/* Ad content placeholder */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md mx-4 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(40, 40, 45, 1), rgba(20, 20, 25, 1))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Premium upsell ad */}
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
                }}
              >
                <Crown className="w-10 h-10 text-primary-foreground" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">Go Premium</h2>
              <p className="text-muted-foreground mb-6">
                Enjoy ad-free music, offline downloads, and high-quality audio
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <span className="text-sm">Ad-free listening</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <span className="text-sm">Download songs offline</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <span className="text-sm">High-quality audio (320kbps)</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-2xl font-semibold text-lg"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                Try Premium Free
              </motion.button>

              <p className="text-xs text-muted-foreground mt-4">
                7-day free trial, then $4.99/month
              </p>
            </div>

            {/* AdMob integration point - uncomment when ready */}
            {/* 
            <div 
              id="admob-interstitial" 
              className="w-full aspect-video bg-muted/20 flex items-center justify-center"
            >
              <span className="text-muted-foreground">AdMob Interstitial</span>
            </div>
            */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default InterstitialAd;
