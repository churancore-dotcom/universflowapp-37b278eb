ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS deep_link text;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.device_tokens
)
DELETE FROM public.device_tokens dt
USING ranked r
WHERE dt.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_user_unique
  ON public.device_tokens(user_id);

CREATE OR REPLACE FUNCTION public.register_device_token(
  _token text,
  _platform text DEFAULT 'android',
  _device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _id uuid;
  _clean_token text := BTRIM(_token);
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF COALESCE(_clean_token, '') = '' THEN
    RAISE EXCEPTION 'Device token required';
  END IF;

  DELETE FROM public.device_tokens
  WHERE token = _clean_token
    AND user_id <> _uid;

  INSERT INTO public.device_tokens (user_id, token, platform, device_info)
  VALUES (
    _uid,
    _clean_token,
    COALESCE(NULLIF(BTRIM(_platform), ''), 'android'),
    COALESCE(_device_info, '{}'::jsonb) || jsonb_build_object('last_seen_at', now())
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    token = EXCLUDED.token,
    platform = EXCLUDED.platform,
    device_info = COALESCE(public.device_tokens.device_info, '{}'::jsonb) || EXCLUDED.device_info,
    updated_at = now()
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_device_token(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_device_token(text, text, jsonb) TO authenticated;