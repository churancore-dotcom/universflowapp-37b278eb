// Curated artist lists organized by category for the AllArtists page.
// Images are resolved on-demand via Last.fm (musicIndexer search) so we
// keep the static list lightweight and culturally relevant.

export interface CuratedArtist {
  name: string;
  category: string;
}

export const ARTIST_CATEGORIES = [
  'Trending',
  'Indian',
  'Bollywood',
  'Punjabi',
  'Global Pop',
  'Hip-Hop',
  'Rock',
  'K-Pop',
  'Latin',
  'Electronic',
  'R&B',
  'Indie',
] as const;

export type ArtistCategory = typeof ARTIST_CATEGORIES[number];

export const CURATED_ARTISTS: CuratedArtist[] = [
  // Indian / Bollywood
  { name: 'Arijit Singh', category: 'Indian' },
  { name: 'A.R. Rahman', category: 'Indian' },
  { name: 'Shreya Ghoshal', category: 'Indian' },
  { name: 'Atif Aslam', category: 'Indian' },
  { name: 'Neha Kakkar', category: 'Indian' },
  { name: 'Sonu Nigam', category: 'Indian' },
  { name: 'Pritam', category: 'Bollywood' },
  { name: 'Vishal-Shekhar', category: 'Bollywood' },
  { name: 'Armaan Malik', category: 'Bollywood' },
  { name: 'Jubin Nautiyal', category: 'Bollywood' },
  { name: 'Darshan Raval', category: 'Bollywood' },
  { name: 'Anirudh Ravichander', category: 'Indian' },
  // Punjabi
  { name: 'Diljit Dosanjh', category: 'Punjabi' },
  { name: 'AP Dhillon', category: 'Punjabi' },
  { name: 'Sidhu Moose Wala', category: 'Punjabi' },
  { name: 'Karan Aujla', category: 'Punjabi' },
  { name: 'Shubh', category: 'Punjabi' },
  { name: 'Honey Singh', category: 'Punjabi' },
  // Global Pop
  { name: 'Taylor Swift', category: 'Global Pop' },
  { name: 'Billie Eilish', category: 'Global Pop' },
  { name: 'Ed Sheeran', category: 'Global Pop' },
  { name: 'Dua Lipa', category: 'Global Pop' },
  { name: 'Ariana Grande', category: 'Global Pop' },
  { name: 'The Weeknd', category: 'Global Pop' },
  { name: 'Olivia Rodrigo', category: 'Global Pop' },
  { name: 'Sabrina Carpenter', category: 'Global Pop' },
  { name: 'Bruno Mars', category: 'Global Pop' },
  // Hip-Hop
  { name: 'Drake', category: 'Hip-Hop' },
  { name: 'Kendrick Lamar', category: 'Hip-Hop' },
  { name: 'Travis Scott', category: 'Hip-Hop' },
  { name: 'Eminem', category: 'Hip-Hop' },
  { name: 'Kanye West', category: 'Hip-Hop' },
  { name: 'J. Cole', category: 'Hip-Hop' },
  { name: 'Post Malone', category: 'Hip-Hop' },
  { name: '21 Savage', category: 'Hip-Hop' },
  // Rock
  { name: 'Coldplay', category: 'Rock' },
  { name: 'Imagine Dragons', category: 'Rock' },
  { name: 'Linkin Park', category: 'Rock' },
  { name: 'Arctic Monkeys', category: 'Rock' },
  { name: 'Twenty One Pilots', category: 'Rock' },
  { name: 'Maroon 5', category: 'Rock' },
  // K-Pop
  { name: 'BTS', category: 'K-Pop' },
  { name: 'BLACKPINK', category: 'K-Pop' },
  { name: 'Stray Kids', category: 'K-Pop' },
  { name: 'NewJeans', category: 'K-Pop' },
  { name: 'TWICE', category: 'K-Pop' },
  { name: 'SEVENTEEN', category: 'K-Pop' },
  // Latin
  { name: 'Bad Bunny', category: 'Latin' },
  { name: 'Karol G', category: 'Latin' },
  { name: 'Shakira', category: 'Latin' },
  { name: 'J Balvin', category: 'Latin' },
  { name: 'Peso Pluma', category: 'Latin' },
  // Electronic
  { name: 'Calvin Harris', category: 'Electronic' },
  { name: 'David Guetta', category: 'Electronic' },
  { name: 'Marshmello', category: 'Electronic' },
  { name: 'Alan Walker', category: 'Electronic' },
  { name: 'The Chainsmokers', category: 'Electronic' },
  { name: 'Avicii', category: 'Electronic' },
  // R&B
  { name: 'SZA', category: 'R&B' },
  { name: 'Frank Ocean', category: 'R&B' },
  { name: 'Beyoncé', category: 'R&B' },
  { name: 'Rihanna', category: 'R&B' },
  { name: 'Doja Cat', category: 'R&B' },
  // Indie
  { name: 'Lana Del Rey', category: 'Indie' },
  { name: 'Hozier', category: 'Indie' },
  { name: 'Tame Impala', category: 'Indie' },
  { name: 'Mitski', category: 'Indie' },
  { name: 'Phoebe Bridgers', category: 'Indie' },
];
