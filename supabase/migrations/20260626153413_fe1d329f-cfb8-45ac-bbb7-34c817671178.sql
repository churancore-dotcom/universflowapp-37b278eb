
-- Remove owner SELECT on base artist_applications table; owners must read via artist_applications_safe view
DROP POLICY IF EXISTS "artist_apps own select" ON public.artist_applications;

-- Replace permissive false policy on stream_url_cache with restrictive guarantee
DROP POLICY IF EXISTS "Backend only" ON public.stream_url_cache;
CREATE POLICY "Block all client access" ON public.stream_url_cache
  AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);
