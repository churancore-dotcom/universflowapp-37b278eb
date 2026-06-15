DROP FUNCTION IF EXISTS public.send_welcome_push_to_self(text, text);

CREATE OR REPLACE FUNCTION public.on_premium_expired_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'expired'
     AND OLD.status IS DISTINCT FROM 'expired'
     AND NEW.subscription_type IN ('premium_monthly','premium_yearly')
     AND NEW.expires_at IS NOT NULL
     AND NEW.notif_expired_at IS NULL THEN
    NEW.notif_expired_at := now();

    PERFORM public.notify_system_push(
      ARRAY[NEW.user_id],
      'Your Premium has ended',
      'Your Premium subscription has ended. Renew anytime to restore ad-free listening, downloads and premium audio.',
      '/premium'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_premium_expired_push ON public.user_subscriptions;
CREATE TRIGGER trg_premium_expired_push
  BEFORE UPDATE OF status ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_premium_expired_push();

CREATE OR REPLACE FUNCTION public.process_premium_expiry_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_exp int := 0;
  v_repaired int := 0;
BEGIN
  -- End active Premium exactly when it has passed. The trigger above sends
  -- the one real APK push and stamps notif_expired_at so it cannot double-send.
  FOR r IN
    SELECT id, user_id
    FROM public.user_subscriptions
    WHERE status = 'active'
      AND subscription_type IN ('premium_monthly','premium_yearly')
      AND expires_at IS NOT NULL
      AND expires_at <= now()
      AND notif_expired_at IS NULL
  LOOP
    UPDATE public.user_subscriptions
       SET status = 'expired', updated_at = now()
     WHERE id = r.id;
    v_exp := v_exp + 1;
  END LOOP;

  -- Repair recent rows that were silently marked expired by older app builds.
  FOR r IN
    SELECT id, user_id
    FROM public.user_subscriptions
    WHERE status = 'expired'
      AND subscription_type IN ('premium_monthly','premium_yearly')
      AND expires_at IS NOT NULL
      AND expires_at <= now()
      AND expires_at >= now() - interval '48 hours'
      AND notif_expired_at IS NULL
  LOOP
    UPDATE public.user_subscriptions
       SET notif_expired_at = now(), updated_at = now()
     WHERE id = r.id;

    PERFORM public.notify_system_push(
      ARRAY[r.user_id],
      'Your Premium has ended',
      'Your Premium subscription has ended. Renew anytime to restore ad-free listening, downloads and premium audio.',
      '/premium'
    );
    v_repaired := v_repaired + 1;
  END LOOP;

  RETURN jsonb_build_object('expired', v_exp, 'repaired', v_repaired);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_premium_expiry_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_premium_expiry_notifications() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('premium-expiry-notifier');
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

SELECT cron.schedule(
  'premium-expiry-notifier',
  '* * * * *',
  $$ SELECT public.process_premium_expiry_notifications(); $$
);