import { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
}

/**
 * MobileShell - Forces a fixed 390px mobile viewport centered on screen
 * All content is rendered inside this shell, no desktop breakpoints
 */
const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div 
      className="fixed inset-0 bg-black flex justify-center"
      style={{ touchAction: 'manipulation' }}
    >
      <div 
        className="relative w-full max-w-[390px] h-full bg-background overflow-y-auto overflow-x-hidden"
        style={{
          minHeight: '100dvh',
          maxHeight: '100dvh',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileShell;
