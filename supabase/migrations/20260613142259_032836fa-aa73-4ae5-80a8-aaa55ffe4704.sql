CREATE OR REPLACE FUNCTION public.send_welcome_push_to_self(_title text, _body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF COALESCE(BTRIM(_title), '') = '' OR COALESCE(BTRIM(_body), '') = '' THEN
    RAISE EXCEPTION 'Title and body required';
  END IF;

  -- Only ever targets the caller themselves — no way to push to another user.
  PERFORM public.notify_system_push(
    ARRAY[v_uid],
    LEFT(_title, 120),
    LEFT(_body, 400),
    '/home'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_welcome_push_to_self(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_welcome_push_to_self(text, text) TO authenticated;