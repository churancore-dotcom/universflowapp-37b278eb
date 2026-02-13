import React, { memo, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Song } from '@/contexts/PlayerContext';
import DownloadAllButton from './DownloadAllButton';
import { triggerHaptic } from '@/hooks/useHaptics';

interface HorizontalSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSeeAll?: () => void;
  songs?: Song[];
}

const HorizontalSection = memo(({ title, subtitle, children, onSeeAll, songs }: HorizontalSectionProps) => {
  return (
    <section className="mb-2">
      {/* Glassmorphism container */}
      <div
        className="rounded-2xl p-3 pb-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {songs && songs.length > 0 && (
              <DownloadAllButton songs={songs} />
            )}
            {onSeeAll && (
              <button
                className="flex items-center gap-0.5 text-xs text-primary font-semibold active:opacity-60 transition-opacity min-h-[44px] px-2"
                onClick={() => {
                  triggerHaptic('selection');
                  onSeeAll();
                }}
              >
                See All
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Horizontal Scroll */}
        <div 
          className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory -mx-3 px-3 scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
});

HorizontalSection.displayName = 'HorizontalSection';

export default HorizontalSection;
