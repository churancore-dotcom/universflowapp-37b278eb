import { useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { 
  isWidgetBridgeAvailable, 
  updateNowPlayingWidget, 
  updateFavoritesWidget,
  updateRecentlyPlayedWidget,
  setupWidgetEventListeners 
} from '@/lib/widgetBridge';

/**
 * Hook to sync player state with Android home screen widgets
 * This should be used once at the app root level
 */
export function useWidgetSync() {
  const { 
    currentSong, 
    isPlaying, 
    progress, 
    duration,
    togglePlay, 
    nextSong, 
    prevSong,
  } = usePlayer();
  
  const lastUpdateRef = useRef<string>('');
  
  // Update Now Playing widget when playback state changes
  useEffect(() => {
    if (!isWidgetBridgeAvailable()) return;
    
    const updateKey = `${currentSong?.id}-${isPlaying}-${Math.floor(progress / 5)}`;
    if (updateKey === lastUpdateRef.current) return;
    lastUpdateRef.current = updateKey;
    
    const progressPercent = duration > 0 ? Math.floor((progress / duration) * 100) : 0;
    
    updateNowPlayingWidget({
      title: currentSong?.title || 'Not Playing',
      artist: currentSong?.artist || 'Tap to open UniversFlow',
      isPlaying,
      progress: progressPercent,
      coverUrl: currentSong?.cover_url || undefined,
    });
  }, [currentSong, isPlaying, progress, duration]);
  
  // Set up widget event listeners
  useEffect(() => {
    if (!isWidgetBridgeAvailable()) return;
    
    const cleanup = setupWidgetEventListeners({
      onPlayPause: () => togglePlay(),
      onNext: () => nextSong(),
      onPrevious: () => prevSong(),
      onShuffleAll: () => {
        console.log('Widget: Shuffle All requested');
      },
      onShuffleFavorites: () => {
        console.log('Widget: Shuffle Favorites requested');
      },
      onPlaySong: (songId: string) => {
        console.log('Widget: Play song requested:', songId);
      },
    });
    
    return cleanup;
  }, [togglePlay, nextSong, prevSong]);
}

/**
 * Hook to update favorites widget when liked songs change
 */
export function useUpdateFavoritesWidget(likedSongs: Array<{
  id: string;
  title: string;
  artist: string;
  cover_url?: string | null;
}>) {
  useEffect(() => {
    if (!isWidgetBridgeAvailable()) return;
    if (!likedSongs || likedSongs.length === 0) return;
    
    updateFavoritesWidget(
      likedSongs.slice(0, 6).map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.cover_url || undefined,
      }))
    );
  }, [likedSongs]);
}

/**
 * Hook to update recently played widget
 */
export function useUpdateRecentlyPlayedWidget(recentSongs: Array<{
  id: string;
  title: string;
  artist: string;
  cover_url?: string | null;
}>) {
  useEffect(() => {
    if (!isWidgetBridgeAvailable()) return;
    if (!recentSongs || recentSongs.length === 0) return;
    
    updateRecentlyPlayedWidget(
      recentSongs.slice(0, 4).map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.cover_url || undefined,
      }))
    );
  }, [recentSongs]);
}
