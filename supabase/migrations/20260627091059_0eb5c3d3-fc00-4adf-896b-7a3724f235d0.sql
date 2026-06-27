
CREATE OR REPLACE FUNCTION public.check_artist_phone_taken(p_phone_hash text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.artist_applications
    WHERE phone_hash = p_phone_hash
      AND status IN ('pending','approved')
      AND (auth.uid() IS NULL OR user_id <> auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_artist_phone_taken(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_artist_stage_name_taken(p_stage_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.artist_applications
    WHERE lower(stage_name) = lower(p_stage_name)
      AND status IN ('pending','approved')
      AND (auth.uid() IS NULL OR user_id <> auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_artist_stage_name_taken(text) TO authenticated;
