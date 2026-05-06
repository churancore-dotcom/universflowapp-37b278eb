import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Search as SearchIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import {
  searchArtistDirectory,
  getTopArtistsByTag,
  enrichArtistImages,
  type IndexedArtistInfo,
} from '@/lib/musicIndexer';

interface ArtistOption {
  name: string;
  image?: string;
  source: 'catalog' | 'lastfm';
  category: string;
}

interface Props {
  onComplete: () => void;
}

const MIN = 3;
const MAX = 10;

const CATEGORIES: { label: string; tag: string }[] = [
  { label: 'Trending', tag: 'top' },
  { label: 'Indian', tag: 'bollywood' },
  { label: 'Punjabi', tag: 'punjabi' },
  { label: 'Pop', tag: 'pop' },
  { label: 'Hip-Hop', tag: 'hip-hop' },
  { label: 'K-Pop', tag: 'k-pop' },
  { label: 'Rock', tag: 'rock' },
  { label: 'Latin', tag: 'latin' },
  { label: 'R&B', tag: 'r&b' },
  { label: 'Electronic', tag: 'electronic' },
  { label: 'Indie', tag: 'indie' },
  { label: 'Country', tag: 'country' },
  { label: 'Metal', tag: 'metal' },
  { label: 'Jazz', tag: 'jazz' },
  { label: 'Classical', tag: 'classical' },
];

const ArtistPicker = ({ onComplete }: Props) => {
  const { user } = useAuth();
  const [byCategory, setByCategory] = useState<Record<string, ArtistOption[]>>({});
  const [searchResults, setSearchResults] = useState<ArtistOption[]>([]);
  const [picks, setPicks] = useState<Map<string, ArtistOption>>(new Map());
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('Trending');
  const [loadingCat, setLoadingCat] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load artists for active category (with PFPs from Deezer)
  useEffect(() => {
    if (search.trim().length >= 2) return; // search overrides
    const cat = CATEGORIES.find(c => c.label === activeCat);
    if (!cat || byCategory[activeCat]?.length) return;

    let cancelled = false;
    setLoadingCat(true);
    getTopArtistsByTag(cat.tag, 50)
      .then(async (items: IndexedArtistInfo[]) => {
        if (cancelled) return;
        // Enrich any missing images via Deezer
        const missing = items.filter(i => !i.image_url).map(i => i.name);
        const enriched = missing.length ? await enrichArtistImages(missing) : {};
        const opts: ArtistOption[] = items.map(i => ({
          name: i.name,
          image: i.image_url || enriched[i.name],
          source: 'lastfm',
          category: activeCat,
        }));
        if (!cancelled) {
          setByCategory(prev => ({ ...prev, [activeCat]: opts }));
        }
      })
      .finally(() => { if (!cancelled) setLoadingCat(false); });

    return () => { cancelled = true; };
  }, [activeCat, search, byCategory]);

  // Debounced search across the entire artist directory (10k+)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchArtistDirectory(q, 40);
      const missing = results.filter(r => !r.image_url).map(r => r.name);
      const enriched = missing.length ? await enrichArtistImages(missing) : {};
      setSearchResults(results.map(r => ({
        name: r.name,
        image: r.image_url || enriched[r.name],
        source: 'lastfm',
        category: 'Search',
      })));
      setSearching(false);
    }, 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const visible = useMemo(() => {
    if (search.trim().length >= 2) return searchResults;
    return byCategory[activeCat] || [];
  }, [search, searchResults, byCategory, activeCat]);

  const toggle = (a: ArtistOption) => {
    triggerHaptic('impactLight');
    setPicks(prev => {
      const next = new Map(prev);
      if (next.has(a.name)) {
        next.delete(a.name);
      } else {
        if (next.size >= MAX) {
          toast.error(`You can pick up to ${MAX} artists`);
          return prev;
        }
        next.set(a.name, a);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (picks.size < MIN) {
      toast.error(`Pick at least ${MIN} artists to continue`);
      return;
    }
    if (!user) { onComplete(); return; }
    setSaving(true);
    try {
      const rows = Array.from(picks.values()).map(a => ({
        user_id: user.id,
        artist_name: a.name,
        artist_image: a.image || null,
        artist_source: a.source,
      }));
      const { error } = await supabase
        .from('user_artist_preferences')
        .upsert(rows, { onConflict: 'user_id,artist_name' });
      if (error) throw error;
      localStorage.setItem(`uf_artists_picked_${user.id}`, '1');
      triggerHaptic('success');
      toast.success('Your feed is being personalized 🎶');
      onComplete();
    } catch (e: any) {
      toast.error(e.message || 'Could not save your picks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-background overflow-y-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="px-5 pt-12 pb-4 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
          style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6482)' }}
        >
          <Sparkles className="w-7 h-7 text-white" />
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight">Pick your vibe</h1>
        <p className="text-xs text-muted-foreground mt-1.5 px-4">
          Choose <span className="text-primary font-semibold">{MIN}–{MAX}</span> artists you love.<br />
          Search any artist or browse by genre — we have thousands.
        </p>
      </div>

      <div className="px-5 pb-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search any artist…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-9 rounded-xl bg-card/70 border border-border/50 text-sm focus:outline-none focus:border-primary/60"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {search.trim().length < 2 && (
        <div className="flex gap-2 px-5 overflow-x-auto hide-scrollbar pb-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => { triggerHaptic('impactLight'); setActiveCat(cat.label); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCat === cat.label ? 'bg-primary text-primary-foreground' : 'bg-card/70 text-muted-foreground border border-border/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pb-32 grid grid-cols-3 gap-3 min-h-[200px]">
        {loadingCat && visible.length === 0 ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-card/40 animate-pulse" />
          ))
        ) : (
          <AnimatePresence>
            {visible.map((a) => {
              const isPicked = picks.has(a.name);
              return (
                <motion.button
                  key={a.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggle(a)}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-card/70 border border-border/40"
                >
                  {a.image ? (
                    <img src={a.image} alt={a.name} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(${a.name.length * 23 % 360} 70% 35%), hsl(${a.name.length * 47 % 360} 70% 25%))` }}>
                      <span className="text-2xl font-extrabold text-white/90">{a.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/85 to-transparent">
                    <p className="text-[11px] font-semibold text-white truncate">{a.name}</p>
                  </div>
                  <AnimatePresence>
                    {isPicked && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(255, 45, 85, 0.55)' }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
        {!loadingCat && !searching && visible.length === 0 && (
          <div className="col-span-3 text-center text-xs text-muted-foreground py-8">
            No artists found{search.trim() ? ` for "${search}"` : ''}.
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 px-4 pb-6 pt-3" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 60%, transparent)' }}>
        <button
          onClick={handleSave}
          disabled={saving || picks.size < MIN}
          className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6482)', color: '#fff' }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {picks.size < MIN ? `Pick ${MIN - picks.size} more` : `Continue with ${picks.size}`}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ArtistPicker;
