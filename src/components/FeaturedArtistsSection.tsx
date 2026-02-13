import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { triggerHaptic } from '@/hooks/useHaptics';

interface Artist {
  id: string;
  name: string;
  photo_url: string | null;
  genre: string | null;
  song_count: number;
}

interface ArtistCardProps {
  artist: Artist;
  index: number;
}

const ArtistCard = memo(({ artist, index }: ArtistCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    triggerHaptic('selection');
    navigate(`/artist/${artist.id}`);
  };

  return (
    <motion.button
      className="flex-shrink-0 w-[78px] snap-start text-center"
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Avatar with animated gradient ring */}
      <div className="relative w-[64px] h-[64px] mx-auto mb-2">
        <div 
          className="absolute -inset-[3px] rounded-full opacity-60"
          style={{
            background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(280 100% 65%), hsl(210 100% 60%), hsl(var(--primary)))',
            filter: 'blur(3px)',
          }}
        />
        <div 
          className="absolute inset-0 rounded-full p-[2.5px]"
          style={{
            background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(280 100% 65%), hsl(210 100% 60%), hsl(var(--primary)))',
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-background">
            {artist.photo_url ? (
              <img 
                src={artist.photo_url} 
                alt={artist.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-[11px] font-semibold truncate text-foreground leading-tight">
        {artist.name}
      </p>
      <p className="text-[9px] text-muted-foreground/60 mt-0.5">
        {artist.song_count} {artist.song_count === 1 ? 'song' : 'songs'}
      </p>
    </motion.button>
  );
});

ArtistCard.displayName = 'ArtistCard';

const FeaturedArtistsSection = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data: artistsData } = await supabase
        .from('artists')
        .select('id, name, photo_url, genre');

      if (artistsData) {
        const artistsWithCounts = await Promise.all(
          artistsData.map(async (artist) => {
            const { count } = await supabase
              .from('songs')
              .select('*', { count: 'exact', head: true })
              .eq('artist_id', artist.id)
              .eq('is_visible', true);

            return { ...artist, song_count: count || 0 };
          })
        );

        const sorted = artistsWithCounts
          .filter(a => a.song_count > 0)
          .sort((a, b) => b.song_count - a.song_count)
          .slice(0, 12);

        setArtists(sorted);
      }
      setLoading(false);
    };

    fetchArtists();
  }, []);

  if (loading || artists.length === 0) return null;

  return (
    <section className="mb-1">
      {/* Glassmorphism section container */}
      <div
        className="rounded-2xl p-3 pb-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">Featured Artists</h2>
        </div>
        
        {/* Horizontal scroll */}
        <div 
          className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory -mx-3 px-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {artists.map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(FeaturedArtistsSection);
