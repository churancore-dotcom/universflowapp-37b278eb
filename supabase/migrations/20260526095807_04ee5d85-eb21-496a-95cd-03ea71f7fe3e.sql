CREATE OR REPLACE FUNCTION public.grant_premium_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expires timestamptz;
  v_type subscription_type;
  v_base timestamptz;
BEGIN
  IF NEW.status IN ('approved','auto_approved') AND OLD.status NOT IN ('approved','auto_approved') THEN
    SELECT GREATEST(now(), COALESCE(expires_at, now()))
      INTO v_base
      FROM public.user_subscriptions
      WHERE user_id = NEW.user_id;
    v_base := COALESCE(v_base, now());

    IF NEW.plan = 'quarterly' THEN
      v_expires := v_base + interval '90 days';
      v_type := 'premium_yearly';
    ELSE
      v_expires := v_base + interval '30 days';
      v_type := 'premium_monthly';
    END IF;

    INSERT INTO public.user_subscriptions (user_id, subscription_type, status, expires_at, platform)
    VALUES (NEW.user_id, v_type, 'active', v_expires, 'web')
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_type = v_type,
      status = 'active',
      expires_at = v_expires,
      platform = 'web',
      updated_at = now();

    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_requests_grant_premium ON public.payment_requests;
DROP TRIGGER IF EXISTS trg_grant_premium_on_approval ON public.payment_requests;
CREATE TRIGGER trg_grant_premium_on_approval
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.grant_premium_on_approval();

DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON public.payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can add subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT EXECUTE ON FUNCTION public.grant_premium_on_approval() TO authenticated;