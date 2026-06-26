import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * App-wide skeleton screens. All shimmer styling lives in the shared
 * `<Skeleton />` primitive so every loading state looks identical.
 */

const Row = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
    style={{ animation: `fade-in 0.32s ease-out ${delay}s both` }}
  >
    <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-1.5">
      <Skeleton className="h-3.5 w-3/4 rounded-md" />
      <Skeleton className="h-2.5 w-1/2 rounded-md" />
    </div>
    <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
  </div>
);

// ── Home — bento + horizontal rail + grid
export const HomeSkeleton = memo(() => (
  <div className="space-y-5">
    <Skeleton className="h-40 rounded-3xl" />

    <div>
      <Skeleton className="h-3 w-28 mb-3 rounded-md" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[130px] space-y-2">
            <Skeleton className="w-[130px] h-[130px] rounded-2xl" />
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-2.5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>

    <div>
      <Skeleton className="h-3 w-24 mb-3 rounded-md" />
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-2.5 w-4/5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  </div>
));
HomeSkeleton.displayName = 'HomeSkeleton';

// ── Library list — songs / downloads
export const LibrarySkeleton = memo(() => (
  <div className="space-y-1">
    {Array.from({ length: 8 }).map((_, i) => (
      <Row key={i} delay={i * 0.035} />
    ))}
  </div>
));
LibrarySkeleton.displayName = 'LibrarySkeleton';

// ── Library artists grid
export const LibraryArtistsSkeleton = memo(() => (
  <div className="grid grid-cols-3 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="flex flex-col items-center p-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.04)',
          animation: `fade-in 0.32s ease-out ${i * 0.04}s both`,
        }}
      >
        <Skeleton className="w-16 h-16 rounded-full mb-2" />
        <Skeleton className="w-16 h-3 rounded-md" />
      </div>
    ))}
  </div>
));
LibraryArtistsSkeleton.displayName = 'LibraryArtistsSkeleton';

// ── Search results
export const SearchSkeleton = memo(() => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-4 h-4 rounded-md" />
      <Skeleton className="w-40 h-3.5 rounded-md" />
    </div>
    {Array.from({ length: 8 }).map((_, i) => (
      <Row key={i} delay={i * 0.03} />
    ))}
  </div>
));
SearchSkeleton.displayName = 'SearchSkeleton';

// ── Artists grid (search → artists tab, /artists page)
export const ArtistGridSkeleton = memo(() => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="p-3 rounded-2xl flex flex-col items-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.04)',
          animation: `fade-in 0.32s ease-out ${i * 0.04}s both`,
        }}
      >
        <Skeleton className="w-20 h-20 rounded-full mb-3" />
        <Skeleton className="h-3 w-24 rounded-md mb-1.5" />
        <Skeleton className="h-2.5 w-16 rounded-md" />
      </div>
    ))}
  </div>
));
ArtistGridSkeleton.displayName = 'ArtistGridSkeleton';

// ── Playlist grid
export const PlaylistGridSkeleton = memo(() => (
  <div className="space-y-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <Row key={i} delay={i * 0.035} />
    ))}
  </div>
));
PlaylistGridSkeleton.displayName = 'PlaylistGridSkeleton';
