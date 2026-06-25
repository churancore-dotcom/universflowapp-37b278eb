-- Security hardening after attack audit

-- 1) New users should get a safe free subscription row server-side.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username text;
  v_country  text;
BEGIN
  v_username := NULLIF(trim(coalesce(NEW.raw_user_meta_data->>'username', '')), '');
  v_country  := upper(left(NULLIF(trim(coalesce(NEW.raw_user_meta_data->>'country_code', '')), ''), 2));

  INSERT INTO public.profiles (user_id, email, is_admin, username, country_code, username_changed)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    v_username,
    v_country,
    v_username IS NOT NULL
  )
  ON CONFLICT (user_id) DO UPDATE
    SET username = COALESCE(public.profiles.username, EXCLUDED.username),
        country_code = COALESCE(public.profiles.country_code, EXCLUDED.country_code),
        username_changed = public.profiles.username_changed OR (EXCLUDED.username IS NOT NULL);

  INSERT INTO public.user_subscriptions (user_id, subscription_type, status, platform)
  VALUES (NEW.id, 'free'::public.subscription_type, 'active'::public.subscription_status, 'web'::public.subscription_platform)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) Remove direct client access to KYC/internal verification fields.
REVOKE SELECT (phone_hash, id_image_hash, face_match_score, face_match_status,
               ocr_extracted_name, name_match_score, auto_check_warnings, auto_checks_at,
               id_doc_front_path, id_doc_back_path, selfie_path)
  ON public.artist_applications FROM authenticated;

-- 3) Force device-token writes through register_device_token; users can still view/remove own devices.
DROP POLICY IF EXISTS "Users manage own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users select own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users delete own device tokens" ON public.device_tokens;

CREATE POLICY "Users select own device tokens"
  ON public.device_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own device tokens"
  ON public.device_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4) Normal users should not have raw write grants to admin/server-maintained tables.
REVOKE INSERT ON public.audit_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.app_versions FROM authenticated;

-- 5) Users can delete their own listening history rows.
DROP POLICY IF EXISTS "Users can delete their own history" ON public.recently_played;
CREATE POLICY "Users can delete their own history"
  ON public.recently_played FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6) The DB-backed rate-limit counter is for trusted server/edge callers only.
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer) TO service_role;