CREATE OR REPLACE FUNCTION public.safe_jsonb_text(_value jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    btrim(
      replace(
        btrim(coalesce(_value::text, ''), '"'),
        E'\\"',
        '"'
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

CREATE OR REPLACE FUNCTION public.notify_system_push(_user_ids uuid[], _title text, _body text, _deep_link text DEFAULT '/premium'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url text;
  v_token text;
BEGIN
  SELECT public.safe_jsonb_text(value) INTO v_url
  FROM public.app_settings
  WHERE key = 'edge_send_system_push_url';

  SELECT btrim(value, '"') INTO v_token
  FROM public.internal_secrets
  WHERE key = 'system_push_token';

  IF v_url IS NULL OR v_token IS NULL OR v_url !~ '^https?://' THEN
    RAISE NOTICE 'notify_system_push: URL or token not configured';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'user_ids', to_jsonb(_user_ids),
      'title', _title,
      'body', _body,
      'deep_link', _deep_link,
      'system_token', v_token
    ),
    timeout_milliseconds := 25000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'notify_system_push failed without blocking caller: %', SQLERRM;
  RETURN;
END;
$function$;

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

  BEGIN
    SELECT public.safe_jsonb_text(value) INTO v_url
    FROM public.app_settings
    WHERE key = 'edge_purge_artist_kyc_url';

    SELECT btrim(value, '"') INTO v_token
    FROM public.internal_secrets
    WHERE key = 'kyc_purge_token';

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
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'purge_artist_kyc_files_on_review failed without blocking review: %', SQLERRM;
    RETURN NEW;
  END;

  RETURN NEW;
END;
$function$;