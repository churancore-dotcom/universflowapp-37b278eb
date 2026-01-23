import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useMediaSession } from '@/hooks/useMediaSession';
import { supabase } from '@/integrations/supabase/client';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  audio_url: string;
  duration?: number;
  artist_id?: string;
  artist_photo_url?: string;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: Song[];
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  isExpanded: boolean;
  crossfade: boolean;
  crossfadeDuration: number;
  audioElement: HTMLAudioElement | null;
  playSong: (song: Song, offlineUrl?: string | null) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  stopSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setExpanded: (expanded: boolean) => void;
  toggleCrossfade: () => void;
  setCrossfadeDuration: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Safe audio play with WebView compatibility
const safeAudioPlay = async (audio: HTMLAudioElement): Promise<void> => {
  try {
    // Some WebViews require user interaction first
    await audio.play();
  } catch (error: any) {
    // NotAllowedError is common in WebViews - audio will play on next user interaction
    if (error?.name === 'NotAllowedError') {
      console.warn('Audio autoplay blocked - will play on user interaction');
    } else {
      console.error('Audio play error:', error);
    }
  }
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [isExpanded, setExpanded] = useState(false);
  const [crossfade, setCrossfade] = useState(true);
  const [crossfadeDuration, setCrossfadeDurationState] = useState(3);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeIntervalRef = useRef<number | null>(null);
  const isCrossfading = useRef(false);
  const isInitialized = useRef(false);

  // Use refs for values that need to be accessed in callbacks without stale closures
  const repeatRef = useRef(repeat);
  const crossfadeRef = useRef(crossfade);
  const crossfadeDurationRef = useRef(crossfadeDuration);
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const shuffleRef = useRef(shuffle);
  const volumeRef = useRef(volume);
  const isPlayingRef = useRef(isPlaying);

  // Keep refs in sync with state
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { crossfadeRef.current = crossfade; }, [crossfade]);
  useEffect(() => { crossfadeDurationRef.current = crossfadeDuration; }, [crossfadeDuration]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Forward declarations for functions used in callbacks
  const startCrossfadeRef = useRef<() => void>(() => {});
  const nextSongInternalRef = useRef<() => void>(() => {});
  const playSongAtIndexRef = useRef<(index: number) => void>(() => {});

  // Initialize audio elements with WebView compatibility
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const audio = new Audio();
    audio.volume = volumeRef.current;
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    
    if ('mediaSession' in navigator) {
      audio.setAttribute('x-webkit-airplay', 'allow');
    }
    
    audioRef.current = audio;

    const nextAudio = new Audio();
    nextAudio.volume = 0;
    nextAudio.preload = 'metadata';
    nextAudio.crossOrigin = 'anonymous';
    nextAudio.setAttribute('playsinline', 'true');
    nextAudio.setAttribute('webkit-playsinline', 'true');
    nextAudioRef.current = nextAudio;

    const handleTimeUpdate = () => {
      if (!isCrossfading.current && audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }

      // Start crossfade before song ends
      if (crossfadeRef.current && queueRef.current.length > 1 && audioRef.current?.duration) {
        const timeLeft = audioRef.current.duration - audioRef.current.currentTime;
        if (timeLeft <= crossfadeDurationRef.current && timeLeft > 0 && !isCrossfading.current) {
          startCrossfadeRef.current();
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || 0);
      }
    };

    const handleEnded = () => {
      if (repeatRef.current === 'one' && audioRef.current) {
        audioRef.current.currentTime = 0;
        safeAudioPlay(audioRef.current);
      } else if (!isCrossfading.current) {
        nextSongInternalRef.current();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (!isCrossfading.current) {
        setIsPlaying(false);
      }
    };

    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      console.warn('Audio error:', audioEl.error?.message || 'Unknown error');
    };

    const handleCanPlay = () => {};

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current && audioRef.current?.paused) {
        safeAudioPlay(audioRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      try {
        audio.pause();
        audio.src = '';
        nextAudio.pause();
        nextAudio.src = '';
      } catch (e) {}
      
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, []);

  // Update volume on both audio elements
  useEffect(() => {
    if (audioRef.current && !isCrossfading.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSongAtIndex = useCallback((index: number) => {
    const song = queueRef.current[index];
    if (song && audioRef.current) {
      // Cancel any ongoing crossfade
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
        crossfadeIntervalRef.current = null;
      }
      isCrossfading.current = false;

      setCurrentSong(song);
      audioRef.current.src = song.audio_url;
      audioRef.current.volume = volumeRef.current;
      safeAudioPlay(audioRef.current);
      setIsPlaying(true);
    }
  }, []);

  // Update ref
  useEffect(() => { playSongAtIndexRef.current = playSongAtIndex; }, [playSongAtIndex]);

  const startCrossfade = useCallback(() => {
    if (!audioRef.current || !nextAudioRef.current || isCrossfading.current) return;
    if (queueRef.current.length <= 1) return;

    isCrossfading.current = true;

    // Determine next song
    let nextIndex: number;
    if (shuffleRef.current) {
      nextIndex = Math.floor(Math.random() * queueRef.current.length);
    } else {
      nextIndex = (currentIndexRef.current + 1) % queueRef.current.length;
      if (nextIndex === 0 && repeatRef.current === 'off') {
        isCrossfading.current = false;
        return;
      }
    }

    const nextSong = queueRef.current[nextIndex];
    if (!nextSong) {
      isCrossfading.current = false;
      return;
    }

    // Prepare next audio
    nextAudioRef.current.src = nextSong.audio_url;
    nextAudioRef.current.volume = 0;
    safeAudioPlay(nextAudioRef.current).catch(() => {
      isCrossfading.current = false;
    });

    const steps = 30;
    const stepDuration = (crossfadeDurationRef.current * 1000) / steps;
    let currentStep = 0;

    crossfadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      const fadeProgress = currentStep / steps;

      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, volumeRef.current * (1 - fadeProgress));
      }
      if (nextAudioRef.current) {
        nextAudioRef.current.volume = Math.min(volumeRef.current, volumeRef.current * fadeProgress);
      }

      if (currentStep >= steps) {
        if (crossfadeIntervalRef.current) {
          clearInterval(crossfadeIntervalRef.current);
          crossfadeIntervalRef.current = null;
        }

        // Complete the transition
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }

        // Swap audio elements
        const temp = audioRef.current;
        audioRef.current = nextAudioRef.current;
        nextAudioRef.current = temp;

        // Update state
        setCurrentSong(nextSong);
        setCurrentIndex(nextIndex);
        setProgress(0);
        setDuration(audioRef.current?.duration || 0);

        isCrossfading.current = false;
      }
    }, stepDuration);
  }, []);

  // Update ref
  useEffect(() => { startCrossfadeRef.current = startCrossfade; }, [startCrossfade]);

  const nextSongInternal = useCallback(() => {
    if (queueRef.current.length === 0) return;
    
    let nextIndex: number;
    if (shuffleRef.current) {
      nextIndex = Math.floor(Math.random() * queueRef.current.length);
    } else {
      nextIndex = (currentIndexRef.current + 1) % queueRef.current.length;
      if (nextIndex === 0 && repeatRef.current === 'off') {
        setIsPlaying(false);
        return;
      }
    }
    
    setCurrentIndex(nextIndex);
    playSongAtIndexRef.current(nextIndex);
  }, []);

  // Update ref
  useEffect(() => { nextSongInternalRef.current = nextSongInternal; }, [nextSongInternal]);

  const playSong = useCallback(async (song: Song, offlineUrl?: string | null) => {
    if (audioRef.current) {
      // Cancel any ongoing crossfade
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
        crossfadeIntervalRef.current = null;
      }
      isCrossfading.current = false;

      setCurrentSong(song);
      audioRef.current.src = offlineUrl || song.audio_url;
      audioRef.current.volume = volumeRef.current;
      await safeAudioPlay(audioRef.current);
      setIsPlaying(true);
      
      // Add to queue if not already there
      const existingIndex = queueRef.current.findIndex(s => s.id === song.id);
      if (existingIndex === -1) {
        setQueueState(prev => [...prev, song]);
        setCurrentIndex(queueRef.current.length);
      } else {
        setCurrentIndex(existingIndex);
      }

      // Track recently played (fire and forget)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('recently_played')
            .insert({
              user_id: user.id,
              song_id: song.id,
            });
        }
      } catch (error) {
        // Silent fail for tracking
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      safeAudioPlay(audioRef.current);
    }
  }, [currentSong, isPlaying]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && currentSong) {
      safeAudioPlay(audioRef.current);
    }
  }, [currentSong]);

  const stopSong = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current.src = '';
      }
    } catch (e) {
      // Ignore errors
    }
    
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
    isCrossfading.current = false;
    setCurrentSong(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setQueueState([]);
    setCurrentIndex(0);
    setExpanded(false);
  }, []);

  const nextSong = useCallback(() => {
    // Cancel crossfade if manually skipping
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
    isCrossfading.current = false;
    nextSongInternalRef.current();
  }, []);

  const prevSong = useCallback(() => {
    if (!audioRef.current) return;
    
    // Cancel crossfade
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
    isCrossfading.current = false;
    
    const currentProgress = audioRef.current.currentTime;
    if (currentProgress > 3) {
      audioRef.current.currentTime = 0;
    } else if (queueRef.current.length > 0) {
      const prevIndex = currentIndexRef.current === 0 ? queueRef.current.length - 1 : currentIndexRef.current - 1;
      setCurrentIndex(prevIndex);
      playSongAtIndexRef.current(prevIndex);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolume = (vol: number) => {
    setVolumeState(vol);
  };

  const setQueue = (songs: Song[]) => {
    setQueueState(songs);
    setCurrentIndex(0);
  };

  const addToQueue = (song: Song) => {
    setQueueState(prev => [...prev, song]);
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeat);
    setRepeat(modes[(currentModeIndex + 1) % modes.length]);
  };

  const toggleCrossfade = () => {
    setCrossfade(!crossfade);
  };

  const setCrossfadeDuration = (seconds: number) => {
    setCrossfadeDurationState(Math.max(1, Math.min(12, seconds)));
  };

  // Media Session API for lock screen / notification controls
  useMediaSession({
    song: currentSong,
    isPlaying,
    onPlay: play,
    onPause: pause,
    onNext: nextSong,
    onPrev: prevSong,
    onSeek: seek,
    duration,
    progress,
  });

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      progress,
      duration,
      volume,
      queue,
      shuffle,
      repeat,
      isExpanded,
      crossfade,
      crossfadeDuration,
      audioElement: audioRef.current,
      playSong,
      togglePlay,
      pause,
      play,
      stopSong,
      nextSong,
      prevSong,
      seek,
      setVolume,
      setQueue,
      addToQueue,
      toggleShuffle,
      toggleRepeat,
      setExpanded,
      toggleCrossfade,
      setCrossfadeDuration,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
