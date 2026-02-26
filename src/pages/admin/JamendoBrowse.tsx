import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, Download, CheckCircle2, Loader2, Globe, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JamendoTrack {
  jamendo_id: string;
  title: string;
  artist: string;
  artist_id: string;
  album: string | null;
  duration: number | null;
  audio_url: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  license: string;
}

const GENRES = [
  'pop', 'rock', 'electronic', 'hiphop', 'jazz', 'classical', 'ambient',
  'blues', 'country', 'folk', 'funk', 'latin', 'metal', 'reggae',
  'rnb', 'soul', 'world', 'soundtrack', 'lounge', 'indie', 'dance'
];

const JamendoBrowse = () => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [bulkImporting, setBulkImporting] = useState(false);

  const searchTracks = useCallback(async (newSearch = true) => {
    setLoading(true);
    const currentOffset = newSearch ? 0 : offset;
    if (newSearch) setOffset(0);

    try {
      const { data, error } = await supabase.functions.invoke('jamendo-search', {
        body: {
          action: query ? 'search' : 'popular',
          query: query || undefined,
          genre: selectedGenre || undefined,
          limit: 20,
          offset: currentOffset,
        },
      });

      if (error) throw error;

      if (newSearch) {
        setTracks(data.tracks);
      } else {
        setTracks(prev => [...prev, ...data.tracks]);
      }
      setTotal(data.total);
    } catch (err: any) {
      toast.error('Failed to search Jamendo: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre, offset]);

  const importTrack = async (track: JamendoTrack) => {
    if (imported.has(track.jamendo_id)) return;
    setImporting(prev => new Set(prev).add(track.jamendo_id));

    try {
      const { error } = await supabase.from('songs').insert({
        title: track.title,
        artist: track.artist,
        audio_url: track.audio_url,
        cover_url: track.cover_url,
        genre: track.genre,
        mood: track.mood,
        album: track.album,
        duration: track.duration,
        is_visible: true,
      });

      if (error) throw error;

      setImported(prev => new Set(prev).add(track.jamendo_id));
      toast.success(`Imported "${track.title}"`);
    } catch (err: any) {
      toast.error(`Failed to import: ${err.message}`);
    } finally {
      setImporting(prev => {
        const next = new Set(prev);
        next.delete(track.jamendo_id);
        return next;
      });
    }
  };

  const importAll = async () => {
    const toImport = tracks.filter(t => !imported.has(t.jamendo_id));
    if (toImport.length === 0) return;

    setBulkImporting(true);
    let successCount = 0;

    for (const track of toImport) {
      try {
        const { error } = await supabase.from('songs').insert({
          title: track.title,
          artist: track.artist,
          audio_url: track.audio_url,
          cover_url: track.cover_url,
          genre: track.genre,
          mood: track.mood,
          album: track.album,
          duration: track.duration,
          is_visible: true,
        });

        if (!error) {
          successCount++;
          setImported(prev => new Set(prev).add(track.jamendo_id));
        }
      } catch {
        // continue with next
      }
    }

    setBulkImporting(false);
    toast.success(`Imported ${successCount} of ${toImport.length} tracks`);
  };

  const loadMore = () => {
    setOffset(prev => prev + 20);
    searchTracks(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchTracks(true);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Jamendo Music Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and import free Creative Commons music
          </p>
        </div>
        {tracks.length > 0 && (
          <Button
            onClick={importAll}
            disabled={bulkImporting || tracks.every(t => imported.has(t.jamendo_id))}
            className="gap-2"
          >
            {bulkImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Import All ({tracks.filter(t => !imported.has(t.jamendo_id)).length})
          </Button>
        )}
      </motion.div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search songs, artists..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {/* Genre Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedGenre === '' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => { setSelectedGenre(''); }}
        >
          <Sparkles className="w-3 h-3 mr-1" /> All
        </Badge>
        {GENRES.map(g => (
          <Badge
            key={g}
            variant={selectedGenre === g ? 'default' : 'outline'}
            className="cursor-pointer capitalize"
            onClick={() => { setSelectedGenre(g === selectedGenre ? '' : g); }}
          >
            {g}
          </Badge>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {tracks.map((track, i) => (
            <motion.div
              key={track.jamendo_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors"
            >
              {/* Cover */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {track.cover_url ? (
                  <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {track.genre && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{track.genre}</Badge>}
                  <span className="text-[10px] text-muted-foreground">{formatDuration(track.duration)}</span>
                </div>
              </div>

              {/* Preview */}
              <audio
                src={track.audio_url}
                controls
                preload="none"
                className="hidden sm:block h-8 w-40 flex-shrink-0"
              />

              {/* Import button */}
              <Button
                size="sm"
                variant={imported.has(track.jamendo_id) ? 'ghost' : 'default'}
                disabled={importing.has(track.jamendo_id) || imported.has(track.jamendo_id)}
                onClick={() => importTrack(track)}
                className="flex-shrink-0 gap-1"
              >
                {imported.has(track.jamendo_id) ? (
                  <><CheckCircle2 className="w-4 h-4 text-primary" /> Added</>
                ) : importing.has(track.jamendo_id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Download className="w-4 h-4" /> Import</>
                )}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {tracks.length === 0 && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Search or browse by genre</p>
            <p className="text-sm">Thousands of free Creative Commons tracks available</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {tracks.length > 0 && tracks.length < total && !loading && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={loadMore}>
              Load More ({tracks.length} / {total})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JamendoBrowse;
