
-- 1) Owner SELECT on artist_applications
CREATE POLICY "artist_apps own select"
  ON public.artist_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) Sanitize artist_profiles.social_links
CREATE OR REPLACE FUNCTION public.sanitize_artist_profile_social_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed text[] := ARRAY['bio','spotify','youtube','instagram','apple_music','twitter','tiktok','soundcloud','website','facebook'];
  v_clean jsonb := '{}'::jsonb;
  v_key text;
BEGIN
  IF NEW.social_links IS NULL OR jsonb_typeof(NEW.social_links) <> 'object' THEN
    NEW.social_links := '{}'::jsonb;
    RETURN NEW;
  END IF;
  FOREACH v_key IN ARRAY v_allowed LOOP
    IF NEW.social_links ? v_key THEN
      v_clean := v_clean || jsonb_build_object(v_key, NEW.social_links -> v_key);
    END IF;
  END LOOP;
  NEW.social_links := v_clean;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sanitize_artist_profile_social_links ON public.artist_profiles;
CREATE TRIGGER trg_sanitize_artist_profile_social_links
  BEFORE INSERT OR UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_artist_profile_social_links();

-- Backfill: strip internal keys from existing rows
UPDATE public.artist_profiles
SET social_links = (
  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
  FROM jsonb_each(COALESCE(social_links, '{}'::jsonb))
  WHERE key = ANY (ARRAY['bio','spotify','youtube','instagram','apple_music','twitter','tiktok','soundcloud','website','facebook'])
)
WHERE social_links IS NOT NULL
  AND social_links::text ~ '(face_shots|selfie|id_doc|kyc)';

-- 3) Public read for music + covers (matches their public bucket flag)
DROP POLICY IF EXISTS "Public can read music and covers" ON storage.objects;
CREATE POLICY "Public can read music and covers"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('music','covers'));

-- 4) IP-based rate limit table + RPC for stream-proxy
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, endpoint)
);

GRANT ALL ON public.ip_rate_limits TO service_role;
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_rate_limits service only"
  ON public.ip_rate_limits FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.check_and_increment_ip_rate_limit(
  _ip_hash text, _endpoint text, _max_per_minute integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.ip_rate_limits(ip_hash, endpoint, window_start, request_count)
  VALUES (_ip_hash, _endpoint, now(), 1)
  ON CONFLICT (ip_hash, endpoint) DO UPDATE
    SET request_count = CASE
          WHEN public.ip_rate_limits.window_start < now() - interval '1 minute' THEN 1
          ELSE public.ip_rate_limits.request_count + 1
        END,
        window_start = CASE
          WHEN public.ip_rate_limits.window_start < now() - interval '1 minute' THEN now()
          ELSE public.ip_rate_limits.window_start
        END
  RETURNING request_count INTO v_count;
  RETURN v_count <= _max_per_minute;
END $$;

REVOKE ALL ON FUNCTION public.check_and_increment_ip_rate_limit(text, text, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ip_rate_limit(text, text, integer) TO service_role;
