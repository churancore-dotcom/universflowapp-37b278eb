-- 1. Wipe payment + subscription history (user-requested hard reset)
TRUNCATE TABLE public.payment_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_subscriptions RESTART IDENTITY CASCADE;

-- 2. Remove promo code feature completely
DROP FUNCTION IF EXISTS public.redeem_promo_code(text) CASCADE;
DROP TABLE IF EXISTS public.code_redemptions CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;