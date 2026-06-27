ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'listener'
  CHECK (account_type IN ('listener', 'artist'));

UPDATE public.profiles p
SET account_type = 'artist'
WHERE account_type <> 'artist'
  AND EXISTS (
    SELECT 1 FROM public.artist_applications a WHERE a.user_id = p.user_id
    UNION ALL
    SELECT 1 FROM public.artist_profiles ap WHERE ap.user_id = p.user_id
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username text;
  v_country  text;
  v_account_type text;
BEGIN
  v_username := NULLIF(trim(coalesce(NEW.raw_user_meta_data->>'username', '')), '');
  v_country  := upper(left(NULLIF(trim(coalesce(NEW.raw_user_meta_data->>'country_code', '')), ''), 2));
  v_account_type := CASE WHEN NEW.raw_user_meta_data->>'account_type' = 'artist' THEN 'artist' ELSE 'listener' END;

  INSERT INTO public.profiles (user_id, email, is_admin, username, country_code, username_changed, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    v_username,
    v_country,
    v_username IS NOT NULL,
    v_account_type
  )
  ON CONFLICT (user_id) DO UPDATE
    SET username = COALESCE(public.profiles.username, EXCLUDED.username),
        country_code = COALESCE(public.profiles.country_code, EXCLUDED.country_code),
        username_changed = public.profiles.username_changed OR (EXCLUDED.username IS NOT NULL),
        account_type = CASE
          WHEN EXCLUDED.account_type = 'artist' THEN 'artist'
          ELSE public.profiles.account_type
        END;

  INSERT INTO public.user_subscriptions (user_id, subscription_type, status, platform)
  VALUES (NEW.id, 'free'::public.subscription_type, 'active'::public.subscription_status, 'web'::public.subscription_platform)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_artist_application(
  p_stage_name text,
  p_real_name text,
  p_phone text,
  p_country_code text,
  p_social_links jsonb,
  p_id_doc_type public.id_doc_type,
  p_id_doc_front_path text,
  p_id_doc_back_path text,
  p_selfie_path text,
  p_artist_photo_path text,
  p_phone_hash text,
  p_id_image_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_application_id uuid;
  v_existing public.artist_applications%ROWTYPE;
  v_next_allowed timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Login required.' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_existing
  FROM public.artist_applications
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.status = 'rejected'::public.artist_app_status THEN
      v_next_allowed := COALESCE(v_existing.reviewed_at, v_existing.updated_at, v_existing.created_at) + interval '7 days';
      IF now() < v_next_allowed THEN
        RAISE EXCEPTION 'Your previous artist verification was rejected. You can re-submit after %.', to_char(v_next_allowed, 'YYYY-MM-DD HH24:MI UTC')
          USING ERRCODE = '22023';
      END IF;
      RAISE EXCEPTION 'Use the re-submit verification button from your artist status screen.'
        USING ERRCODE = '22023';
    END IF;

    RAISE EXCEPTION 'You already have an artist application. Open the artist status screen for live updates.'
      USING ERRCODE = '23505';
  END IF;

  IF p_phone_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.artist_applications other
    WHERE other.phone_hash = NULLIF(BTRIM(p_phone_hash), '')
      AND other.status IN ('pending','approved')
  ) THEN
    RAISE EXCEPTION 'This phone number is already linked to another artist account on Universflow.'
      USING ERRCODE = '23505';
  END IF;

  IF p_id_image_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.artist_applications other
    WHERE other.id_image_hash = NULLIF(BTRIM(p_id_image_hash), '')
      AND other.status IN ('pending','approved')
  ) THEN
    RAISE EXCEPTION 'This ID document is already linked to another artist account on Universflow.'
      USING ERRCODE = '23505';
  END IF;

  UPDATE public.profiles
  SET account_type = 'artist'
  WHERE user_id = v_user_id;

  INSERT INTO public.artist_applications (
    user_id,
    stage_name,
    real_name,
    phone,
    country_code,
    social_links,
    id_doc_type,
    id_doc_front_path,
    id_doc_back_path,
    selfie_path,
    artist_photo_path,
    phone_hash,
    id_image_hash,
    status
  ) VALUES (
    v_user_id,
    NULLIF(BTRIM(p_stage_name), ''),
    NULLIF(BTRIM(p_real_name), ''),
    NULLIF(BTRIM(p_phone), ''),
    upper(left(NULLIF(BTRIM(p_country_code), ''), 2)),
    COALESCE(p_social_links, '{}'::jsonb),
    p_id_doc_type,
    NULLIF(BTRIM(p_id_doc_front_path), ''),
    NULLIF(BTRIM(p_id_doc_back_path), ''),
    NULLIF(BTRIM(p_selfie_path), ''),
    NULLIF(BTRIM(p_artist_photo_path), ''),
    NULLIF(BTRIM(p_phone_hash), ''),
    NULLIF(BTRIM(p_id_image_hash), ''),
    'pending'::public.artist_app_status
  )
  RETURNING id INTO v_application_id;

  RETURN jsonb_build_object('success', true, 'application_id', v_application_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reapply_artist_application(
  p_application_id uuid,
  p_social_links jsonb,
  p_id_doc_type public.id_doc_type,
  p_id_doc_front_path text,
  p_id_doc_back_path text,
  p_selfie_path text,
  p_artist_photo_path text,
  p_id_image_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app public.artist_applications%ROWTYPE;
  v_next_allowed timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login required.' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_app
  FROM public.artist_applications
  WHERE id = p_application_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artist application not found.' USING ERRCODE = '02000';
  END IF;

  IF v_app.status <> 'rejected'::public.artist_app_status THEN
    RAISE EXCEPTION 'Only rejected applications can be re-submitted.' USING ERRCODE = '22023';
  END IF;

  v_next_allowed := COALESCE(v_app.reviewed_at, v_app.updated_at, v_app.created_at) + interval '7 days';
  IF now() < v_next_allowed THEN
    RAISE EXCEPTION 'You can re-submit verification after %.', to_char(v_next_allowed, 'YYYY-MM-DD HH24:MI UTC')
      USING ERRCODE = '22023';
  END IF;

  IF v_app.phone_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.artist_applications other
    WHERE other.id <> v_app.id
      AND other.phone_hash = v_app.phone_hash
      AND other.status IN ('pending','approved')
  ) THEN
    RAISE EXCEPTION 'This phone number is already linked to another artist account on Universflow.'
      USING ERRCODE = '23505';
  END IF;

  IF p_id_image_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.artist_applications other
    WHERE other.id <> v_app.id
      AND other.id_image_hash = NULLIF(BTRIM(p_id_image_hash), '')
      AND other.status IN ('pending','approved')
  ) THEN
    RAISE EXCEPTION 'This ID document is already linked to another artist account on Universflow.'
      USING ERRCODE = '23505';
  END IF;

  UPDATE public.profiles
  SET account_type = 'artist'
  WHERE user_id = auth.uid();

  UPDATE public.artist_applications
  SET
    social_links = COALESCE(p_social_links, '{}'::jsonb),
    id_doc_type = p_id_doc_type,
    id_doc_front_path = NULLIF(BTRIM(p_id_doc_front_path), ''),
    id_doc_back_path = NULLIF(BTRIM(p_id_doc_back_path), ''),
    selfie_path = NULLIF(BTRIM(p_selfie_path), ''),
    artist_photo_path = NULLIF(BTRIM(p_artist_photo_path), ''),
    id_image_hash = NULLIF(BTRIM(p_id_image_hash), ''),
    status = 'pending'::public.artist_app_status,
    admin_note = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL,
    face_match_score = NULL,
    face_match_status = NULL,
    ocr_extracted_name = NULL,
    name_match_score = NULL,
    auto_check_warnings = NULL,
    auto_checks_at = NULL,
    updated_at = now()
  WHERE id = v_app.id;

  RETURN jsonb_build_object('success', true, 'application_id', v_app.id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_artist_application(text, text, text, text, jsonb, public.id_doc_type, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_artist_application(text, text, text, text, jsonb, public.id_doc_type, text, text, text, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reapply_artist_application(uuid, jsonb, public.id_doc_type, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reapply_artist_application(uuid, jsonb, public.id_doc_type, text, text, text, text, text) TO authenticated, service_role;