import { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  className?: string;
}

const BannerAd = memo(function BannerAd({ position = 'bottom', className = '' }: BannerAdProps) {
  const { isPremium, isLoading } = usePremium();

  // Don't show ads to premium users or while loading
  if (isPremium || isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
      className={`
        fixed ${position === 'bottom' ? 'bottom-20' : 'top-0'} left-0 right-0 z-40
        px-4 py-2 safe-area-inset
        ${className}
      `}
    >
      <div 
        className="relative mx-auto max-w-md rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 40, 45, 0.95), rgba(30, 30, 35, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Ad placeholder content */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))' }}
            >
              <span className="text-xs font-bold text-primary-foreground">AD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Go Premium</p>
              <p className="text-xs text-muted-foreground">Remove ads & unlock features</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            Upgrade
          </motion.button>
        </div>

        {/* AdMob integration point - uncomment when ready */}
        {/* 
        <div 
          id="admob-banner" 
          className="w-full h-[50px] bg-muted/20 flex items-center justify-center"
        >
          <span className="text-xs text-muted-foreground">AdMob Banner</span>
        </div>
        */}
      </div>
    </motion.div>
  );
});

export default BannerAd;
