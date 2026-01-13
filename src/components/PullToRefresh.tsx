import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { iosSpring } from '@/lib/animations';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  isTriggered: boolean;
}

const PullToRefreshIndicator = ({ 
  pullDistance, 
  isRefreshing, 
  progress, 
  isTriggered 
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="absolute left-0 right-0 flex justify-center pointer-events-none z-40"
      style={{ top: 60 }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: progress > 0.2 ? 1 : 0,
        y: pullDistance - 40,
      }}
      transition={isRefreshing ? { duration: 0.2 } : { duration: 0 }}
    >
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        animate={{
          scale: isTriggered || isRefreshing ? 1 : 0.8 + progress * 0.2,
        }}
        transition={iosSpring}
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: progress * 180 }}
          transition={isRefreshing 
            ? { duration: 0.8, repeat: Infinity, ease: "linear" }
            : { duration: 0 }
          }
        >
          <RefreshCw 
            className={`w-5 h-5 transition-colors ${
              isTriggered || isRefreshing ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PullToRefreshIndicator;
