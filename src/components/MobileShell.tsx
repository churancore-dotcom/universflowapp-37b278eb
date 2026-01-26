import { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
}

/**
 * MobileShell - Fixed 390px mobile viewport centered on screen
 * Forces mobile-only rendering, no desktop/responsive logic
 */
const MobileShell = ({ children }: MobileShellProps) => {
  return (
    // Outer container: fills screen with black background
    <div 
      className="fixed inset-0 w-full h-full bg-black flex items-center justify-center"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Inner container: fixed 390px mobile viewport */}
      <div 
        className="relative w-[390px] h-full max-h-[100dvh] bg-background overflow-hidden"
        style={{
          // Clip anything outside the 390px viewport
          contain: 'strict',
        }}
      >
        {/* Scrollable content area */}
        <div 
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileShell;
