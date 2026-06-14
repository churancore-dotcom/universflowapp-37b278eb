CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_jwt_role text;
BEGIN
  BEGIN
    v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    v_jwt_role := NULL;
  END;

  IF v_jwt_role IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('service_role','postgres','supabase_admin','authenticator')
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
DECLARE
  v_jwt_role text;
BEGIN
  BEGIN
    v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    v_jwt_role := NULL;
  END;

  IF v_jwt_role IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('service_role','postgres','supabase_admin','authenticator')
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

CREATE OR REPLACE FUNCTION public.is_premium_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_jwt_role text;
BEGIN
  BEGIN
    v_jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    v_jwt_role := NULL;
  END;

  IF v_jwt_role IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('service_role','postgres','supabase_admin','authenticator')
     AND _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to query subscriptions for other users';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = _user_id
      AND us.status = 'active'
      AND us.subscription_type IN ('premium_monthly','premium_yearly')
      AND (us.expires_at IS NULL OR us.expires_at > now())
  );
END;
$function$;