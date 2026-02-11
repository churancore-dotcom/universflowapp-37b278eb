// Widget Bridge for Android Home Screen Widgets
// This module provides a bridge between the web app and native Android widgets

/**
 * Check if we're running in a Capacitor Android environment with widget support
 */
export function isWidgetBridgeAvailable(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.getPlatform?.() === 'android' &&
         typeof (window as any).Capacitor.Plugins?.WidgetBridge !== 'undefined';
}

function getWidgetBridge() {
  if (!isWidgetBridgeAvailable()) return null;
  return (window as any).Capacitor.Plugins.WidgetBridge;
}

/**
 * Update the Now Playing widget with current playback state
 */
export async function updateNowPlayingWidget(data: {
  title: string;
  artist: string;
  isPlaying: boolean;
  progress: number;
  coverUrl?: string;
}): Promise<void> {
  const bridge = getWidgetBridge();
  if (!bridge) return;
  try {
    await bridge.updateNowPlaying(data);
  } catch (error) {
    console.error('Failed to update Now Playing widget:', error);
  }
}

/**
 * Update the Favorites widget with user's liked songs
 */
export async function updateFavoritesWidget(favorites: Array<{
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}>): Promise<void> {
  const bridge = getWidgetBridge();
  if (!bridge) return;
  try {
    await bridge.updateFavorites({
      favorites: JSON.stringify(favorites.slice(0, 6))
    });
  } catch (error) {
    console.error('Failed to update Favorites widget:', error);
  }
}

/**
 * Update the Recently Played widget
 */
export async function updateRecentlyPlayedWidget(songs: Array<{
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}>): Promise<void> {
  const bridge = getWidgetBridge();
  if (!bridge) return;
  try {
    await bridge.updateRecentlyPlayed({
      recent: JSON.stringify(songs.slice(0, 4))
    });
  } catch (error) {
    console.error('Failed to update Recently Played widget:', error);
  }
}

/**
 * Force refresh all widgets
 */
export async function refreshAllWidgets(): Promise<void> {
  const bridge = getWidgetBridge();
  if (!bridge) return;
  try {
    await bridge.refreshWidgets();
  } catch (error) {
    console.error('Failed to refresh widgets:', error);
  }
}

/**
 * Check if the app was launched from a widget action
 */
export async function checkWidgetLaunchIntent(): Promise<{
  action: string;
  songId?: string;
} | null> {
  const bridge = getWidgetBridge();
  if (!bridge) return null;
  try {
    const result = await bridge.checkLaunchIntent();
    if (result && result.action !== 'none') {
      return {
        action: result.action,
        songId: result.songId,
      };
    }
  } catch (error) {
    console.error('Failed to check widget launch intent:', error);
  }
  return null;
}

/**
 * Listen for widget action events via deep links and launch intents
 */
export function setupWidgetEventListeners(handlers: {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onShuffleAll?: () => void;
  onShuffleFavorites?: () => void;
  onPlaySong?: (songId: string) => void;
}): () => void {
  if (typeof (window as any).Capacitor === 'undefined') {
    return () => {};
  }

  // Check launch intent on startup
  checkWidgetLaunchIntent().then(result => {
    if (!result) return;
    handleWidgetAction(result.action, result.songId, handlers);
  });

  // Listen for new intents when app is already open
  const handleAppUrlOpen = (event: CustomEvent<{ url: string }>) => {
    const url = event.detail?.url;
    if (!url) return;

    try {
      const parsed = new URL(url);
      const action = parsed.searchParams.get('action');
      const songId = parsed.searchParams.get('song_id');
      if (action) {
        handleWidgetAction(action, songId || undefined, handlers);
      }
    } catch {
      // Handle simple action strings
      if (url.includes('WIDGET_PLAY_PAUSE')) handlers.onPlayPause?.();
      else if (url.includes('WIDGET_NEXT')) handlers.onNext?.();
      else if (url.includes('WIDGET_PREVIOUS')) handlers.onPrevious?.();
      else if (url.includes('WIDGET_SHUFFLE_ALL')) handlers.onShuffleAll?.();
      else if (url.includes('WIDGET_SHUFFLE_FAVORITES')) handlers.onShuffleFavorites?.();
    }
  };

  document.addEventListener('appUrlOpen', handleAppUrlOpen as EventListener);

  // Also listen for Capacitor's appRestoredResult for new intent handling
  const Cap = (window as any).Capacitor;
  let newIntentListener: any = null;
  if (Cap?.Plugins?.App) {
    Cap.Plugins.App.addListener('appUrlOpen', (data: { url: string }) => {
      handleAppUrlOpen(new CustomEvent('appUrlOpen', { detail: data }));
    }).then((listener: any) => {
      newIntentListener = listener;
    });
  }

  return () => {
    document.removeEventListener('appUrlOpen', handleAppUrlOpen as EventListener);
    if (newIntentListener) {
      newIntentListener.remove();
    }
  };
}

function handleWidgetAction(action: string, songId: string | undefined, handlers: {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onShuffleAll?: () => void;
  onShuffleFavorites?: () => void;
  onPlaySong?: (songId: string) => void;
}) {
  switch (action) {
    case 'WIDGET_PLAY_PAUSE':
      handlers.onPlayPause?.();
      break;
    case 'WIDGET_NEXT':
      handlers.onNext?.();
      break;
    case 'WIDGET_PREVIOUS':
      handlers.onPrevious?.();
      break;
    case 'WIDGET_SHUFFLE_ALL':
      handlers.onShuffleAll?.();
      break;
    case 'WIDGET_SHUFFLE_FAVORITES':
      handlers.onShuffleFavorites?.();
      break;
    case 'WIDGET_PLAY_SONG':
      if (songId) handlers.onPlaySong?.(songId);
      break;
  }
}

export default {
  isWidgetBridgeAvailable,
  updateNowPlayingWidget,
  updateFavoritesWidget,
  updateRecentlyPlayedWidget,
  refreshAllWidgets,
  checkWidgetLaunchIntent,
  setupWidgetEventListeners,
};
