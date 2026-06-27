
CREATE OR REPLACE FUNCTION public.purge_artist_kyc_files_on_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_url   text;
  v_token text;
  v_paths text[] := ARRAY[]::text[];
BEGIN
  IF NEW.status NOT IN ('approved','rejected') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.id_doc_front_path IS NOT NULL THEN v_paths := v_paths || OLD.id_doc_front_path; END IF;
  IF OLD.id_doc_back_path  IS NOT NULL THEN v_paths := v_paths || OLD.id_doc_back_path;  END IF;
  IF OLD.selfie_path       IS NOT NULL THEN v_paths := v_paths || OLD.selfie_path;       END IF;

  IF array_length(v_paths, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- app_settings.value is jsonb → use #>> to coerce to text
  SELECT trim(both '"' from (value #>> '{}')) INTO v_url
    FROM public.app_settings WHERE key = 'edge_purge_artist_kyc_url';

  -- internal_secrets.value is TEXT (not jsonb) → use trim directly.
  -- The old code applied the jsonb operator #>> to a text column, which
  -- raised "operator does not exist: text #>> unknown" and broke every
  -- approve/reject from the admin desk.
  SELECT trim(both '"' from value) INTO v_token
    FROM public.internal_secrets WHERE key = 'kyc_purge_token';

  IF v_url IS NULL OR v_token IS NULL OR v_url !~ '^https?://' THEN
    RAISE NOTICE 'purge_artist_kyc_files_on_review: URL or token not configured';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'system_token', v_token,
      'paths', to_jsonb(v_paths),
      'application_id', NEW.id
    ),
    timeout_milliseconds := 20000
  );

  RETURN NEW;
END;
$function$;
