
-- 1) Token + URL for the purge edge function
INSERT INTO public.internal_secrets(key, value)
VALUES ('kyc_purge_token', to_jsonb(encode(gen_random_bytes(32), 'hex')))
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings(key, value, description)
VALUES (
  'edge_purge_artist_kyc_url',
  to_jsonb(concat('https://', current_setting('app.settings.project_ref', true), '.supabase.co/functions/v1/purge-artist-kyc')),
  'Edge function endpoint that deletes KYC files from the artist-kyc bucket after a review.'
)
ON CONFLICT (key) DO NOTHING;

-- Best-effort: fall back to the well-known project URL if app.settings.project_ref isn't set
UPDATE public.app_settings
SET value = to_jsonb('https://kzaeahjeqlihmxrfhjqd.supabase.co/functions/v1/purge-artist-kyc'::text)
WHERE key = 'edge_purge_artist_kyc_url'
  AND (value #>> '{}') !~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/';

-- 2) After-review trigger: collect old KYC paths and POST to the purge fn
CREATE OR REPLACE FUNCTION public.purge_artist_kyc_files_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Pull the ORIGINAL paths from the row before the BEFORE trigger nulled them.
  IF OLD.id_doc_front_path IS NOT NULL THEN v_paths := v_paths || OLD.id_doc_front_path; END IF;
  IF OLD.id_doc_back_path  IS NOT NULL THEN v_paths := v_paths || OLD.id_doc_back_path;  END IF;
  IF OLD.selfie_path       IS NOT NULL THEN v_paths := v_paths || OLD.selfie_path;       END IF;

  IF array_length(v_paths, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT trim(both '"' from (value #>> '{}')) INTO v_url
    FROM public.app_settings WHERE key = 'edge_purge_artist_kyc_url';
  SELECT trim(both '"' from (value #>> '{}')) INTO v_token
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
$$;

DROP TRIGGER IF EXISTS trg_purge_artist_kyc_files_on_review ON public.artist_applications;
CREATE TRIGGER trg_purge_artist_kyc_files_on_review
AFTER UPDATE OF status ON public.artist_applications
FOR EACH ROW
EXECUTE FUNCTION public.purge_artist_kyc_files_on_review();
