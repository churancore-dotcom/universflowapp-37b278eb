
-- 1) artist_applications: column-level grants hide KYC fields from applicants
DO $$
DECLARE safe_cols text[] := ARRAY[
  'id','user_id','stage_name','country_code','social_links',
  'artist_photo_path','status','admin_note',
  'reviewed_at','reviewed_by','created_at','updated_at'
];
BEGIN
  REVOKE SELECT ON public.artist_applications FROM authenticated;
  EXECUTE format(
    'GRANT SELECT (%s) ON public.artist_applications TO authenticated',
    array_to_string(ARRAY(SELECT quote_ident(c) FROM unnest(safe_cols) c), ', ')
  );
END $$;

-- 2) realtime.messages: drop overly-broad admins-only restrictive policy.
DROP POLICY IF EXISTS "Realtime broadcast admins only" ON realtime.messages;

-- 3) Move helper SECURITY DEFINER functions out of the API-exposed public schema.
CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

ALTER FUNCTION public.is_session_host(uuid, uuid)  SET SCHEMA app_private;
ALTER FUNCTION public.is_session_member(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_premium_user(uuid)         SET SCHEMA app_private;

REVOKE ALL ON FUNCTION app_private.is_session_host(uuid, uuid)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_session_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_premium_user(uuid)         FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_session_host(uuid, uuid)   TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_session_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_premium_user(uuid)         TO authenticated;
