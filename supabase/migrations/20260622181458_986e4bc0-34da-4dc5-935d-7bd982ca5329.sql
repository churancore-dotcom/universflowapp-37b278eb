
-- 1) Lock KYC judgment fields on artist_applications updates by non-admins
CREATE OR REPLACE FUNCTION public.prevent_artist_application_privileged_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_jwt_role text;
BEGIN
  BEGIN v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN v_jwt_role := NULL; END;

  IF v_jwt_role = 'service_role'
     OR current_user IN ('service_role','postgres','supabase_admin')
     OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  NEW.status            := OLD.status;
  NEW.admin_note        := OLD.admin_note;
  NEW.reviewed_by       := OLD.reviewed_by;
  NEW.reviewed_at       := OLD.reviewed_at;
  -- Locked identity fields
  NEW.stage_name        := OLD.stage_name;
  NEW.real_name         := OLD.real_name;
  NEW.phone             := OLD.phone;
  NEW.country_code      := OLD.country_code;
  -- Locked KYC judgment fields — only admin / service_role / verify edge fn may write
  NEW.face_match_score    := OLD.face_match_score;
  NEW.face_match_status   := OLD.face_match_status;
  NEW.ocr_extracted_name  := OLD.ocr_extracted_name;
  NEW.name_match_score    := OLD.name_match_score;
  NEW.auto_check_warnings := OLD.auto_check_warnings;
  NEW.auto_checks_at      := OLD.auto_checks_at;
  NEW.phone_hash          := OLD.phone_hash;
  NEW.id_image_hash       := OLD.id_image_hash;
  RETURN NEW;
END;
$function$;

-- 2a) Add INSERT guard on artist_songs so applicants can't seed status='live' or status<>default
CREATE OR REPLACE FUNCTION public.prevent_artist_song_privileged_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_jwt_role text; v_privileged boolean;
BEGIN
  BEGIN v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN v_jwt_role := NULL; END;

  v_privileged := v_jwt_role = 'service_role'
    OR current_user IN ('service_role','postgres','supabase_admin')
    OR public.has_role(auth.uid(), 'admin'::public.app_role);

  IF NOT v_privileged THEN
    -- Force defaults: review pipeline owns status & moderation columns
    NEW.status := 'pending_review'::public.artist_song_status;
    NEW.takedown_reason := NULL;
    NEW.play_count := 0;
    NEW.like_count := 0;
    NEW.download_count := 0;
    NEW.view_count := 0;
  END IF;
  RETURN NEW;
END $function$;

-- If the enum default name differs, fall back to whatever default the column has
DO $$
DECLARE v_default text;
BEGIN
  SELECT column_default INTO v_default FROM information_schema.columns
   WHERE table_schema='public' AND table_name='artist_songs' AND column_name='status';
  -- If 'pending_review' isn't a valid enum, swap to first enum value
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'artist_song_status' AND e.enumlabel = 'pending_review'
  ) THEN
    EXECUTE format($f$
      CREATE OR REPLACE FUNCTION public.prevent_artist_song_privileged_insert()
       RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
      AS $body$
      DECLARE v_jwt_role text; v_privileged boolean; v_default public.artist_song_status;
      BEGIN
        BEGIN v_jwt_role := current_setting('request.jwt.claim.role', true);
        EXCEPTION WHEN OTHERS THEN v_jwt_role := NULL; END;
        v_privileged := v_jwt_role = 'service_role'
          OR current_user IN ('service_role','postgres','supabase_admin')
          OR public.has_role(auth.uid(), 'admin'::public.app_role);
        IF NOT v_privileged THEN
          SELECT (enumlabel)::public.artist_song_status INTO v_default
            FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'artist_song_status' ORDER BY enumsortorder LIMIT 1;
          NEW.status := v_default;
          NEW.takedown_reason := NULL;
          NEW.play_count := 0; NEW.like_count := 0;
          NEW.download_count := 0; NEW.view_count := 0;
        END IF;
        RETURN NEW;
      END $body$;
    $f$);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_artist_song_privileged_insert ON public.artist_songs;
CREATE TRIGGER trg_prevent_artist_song_privileged_insert
  BEFORE INSERT ON public.artist_songs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_artist_song_privileged_insert();

-- 3) Tighten cross-user guards on has_role / has_premium_subscription
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_jwt_role text;
BEGIN
  BEGIN v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN v_jwt_role := NULL; END;

  -- Privileged contexts (edge functions / internal jobs) bypass the cross-user guard
  IF v_jwt_role IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('service_role','postgres','supabase_admin')
     AND _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to query roles for other users';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_premium_subscription(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_jwt_role text;
BEGIN
  BEGIN v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN v_jwt_role := NULL; END;

  IF v_jwt_role IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('service_role','postgres','supabase_admin')
     AND _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to query subscriptions for other users';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND subscription_type IN ('premium_monthly','premium_yearly')
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$function$;
