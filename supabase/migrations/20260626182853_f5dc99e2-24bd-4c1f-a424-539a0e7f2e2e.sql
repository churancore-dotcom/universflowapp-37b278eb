ALTER TABLE public.artist_songs
  ADD COLUMN IF NOT EXISTS lyrics_plain text,
  ADD COLUMN IF NOT EXISTS lyrics_synced text,
  ADD COLUMN IF NOT EXISTS lyrics_source text DEFAULT 'artist';

COMMENT ON COLUMN public.artist_songs.lyrics_plain IS 'Optional plain text lyrics provided by the artist.';
COMMENT ON COLUMN public.artist_songs.lyrics_synced IS 'Optional synced LRC lyrics provided by the artist.';
COMMENT ON COLUMN public.artist_songs.lyrics_source IS 'Source label for artist-provided lyrics.';