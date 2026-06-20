// Bridge between Capacitor's native AudioFocus plugin and the web player.
// Safe to import in any environment — becomes a no-op outside the Capacitor APK.

import { Capacitor, registerPlugin } from '@capacitor/core';

interface AudioFocusPluginShape {
  keepAlive?: () => Promise<void> | void;
  addListener?: (
    eventName: 'audioFocus',
    cb: (data: { action: string }) => void,
  ) => Promise<{ remove?: () => void }> | { remove?: () => void };
}

const AudioFocusBridge = registerPlugin<AudioFocusPluginShape>('AudioFocus');

let listenerAttached = false;
let latestPause: (() => void) | null = null;
let latestResume: (() => void) | null = null;

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      Plugins: Record<string, any>;
    };
  }
}

export function initNativeBridge(
  onPause: () => void,
  onResume: () => void
): void {
  if (typeof window === 'undefined') return;
  if (Capacitor.isNativePlatform?.() !== true && !window.Capacitor?.isNativePlatform?.()) return;
  latestPause = onPause;
  latestResume = onResume;

  const AudioFocus = AudioFocusBridge || window.Capacitor?.Plugins?.AudioFocus;
  if (!AudioFocus) return;

  if (!listenerAttached) {
    AudioFocus.addListener?.('audioFocus', (data: { action: string }) => {
      if (data?.action === 'pause') latestPause?.();
      if (data?.action === 'resume') latestResume?.();
    });
    listenerAttached = true;
  }

  try {
    AudioFocus.keepAlive?.();
  } catch {
    /* noop */
  }
}
