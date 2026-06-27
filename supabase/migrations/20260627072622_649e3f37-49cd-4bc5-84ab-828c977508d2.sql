CREATE OR REPLACE FUNCTION public.safe_jsonb_text(_value jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    btrim(
      btrim(
        btrim(coalesce(_value #>> '{}', _value::text), '"'),
        E'\\'
      ),
      '"'
    ),
    ''
  )
$$;

UPDATE public.app_settings
SET value = to_jsonb(public.safe_jsonb_text(value))
WHERE key IN ('edge_purge_artist_kyc_url', 'edge_send_system_push_url')
  AND public.safe_jsonb_text(value) IS NOT NULL;