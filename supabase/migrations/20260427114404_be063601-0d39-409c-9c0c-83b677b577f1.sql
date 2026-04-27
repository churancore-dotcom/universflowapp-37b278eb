
-- 1. Fix profiles email exposure to friends
-- Drop the friend SELECT policy that exposes email
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;

-- Create a security definer function that returns only safe fields for friends
CREATE OR REPLACE FUNCTION public.get_friend_profile(_friend_user_id uuid)
RETURNS TABLE(user_id uuid, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = _friend_user_id
    AND EXISTS (
      SELECT 1 FROM public.friends f
      WHERE f.status = 'accepted'
        AND ((f.user_id = auth.uid() AND f.friend_id = _friend_user_id)
          OR (f.friend_id = auth.uid() AND f.user_id = _friend_user_id))
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_friend_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_friend_profile(uuid) TO authenticated;

-- 2. Lock down user_roles INSERT/UPDATE/DELETE to admins only via restrictive policy
-- The existing "Admins can manage roles" ALL policy is permissive; add a restrictive guard
CREATE POLICY "Only admins can modify user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Listening sessions: restrict full SELECT (with session_code) to host & members
DROP POLICY IF EXISTS "Anyone authenticated can view active sessions" ON public.listening_sessions;

CREATE POLICY "Members and host can view session"
ON public.listening_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = host_user_id
  OR EXISTS (
    SELECT 1 FROM public.listening_session_members m
    WHERE m.session_id = listening_sessions.id AND m.user_id = auth.uid()
  )
);

-- Provide an RPC to join by session_code without exposing the table
CREATE OR REPLACE FUNCTION public.join_listening_session(p_session_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id INTO v_session_id
  FROM public.listening_sessions
  WHERE session_code = p_session_code AND is_active = true
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  INSERT INTO public.listening_session_members(session_id, user_id)
  VALUES (v_session_id, v_user)
  ON CONFLICT DO NOTHING;

  RETURN v_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_listening_session(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_listening_session(text) TO authenticated;

-- 4. Remove dangerous redeem_promo_code overload that allows specifying any user_id
DROP FUNCTION IF EXISTS public.redeem_promo_code(text, uuid);

-- 5. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon/public where inappropriate
-- Keep public access only to functions that must be callable broadly:
--   - get_user_count (read-only count, fine)
--   - find_profile_by_share_code (intended public lookup)
--   - has_role / has_premium_subscription (used by RLS, must remain executable)

-- Restrict admin/internal helpers
REVOKE EXECUTE ON FUNCTION public.admin_log_event(text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_old_subscriptions() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.expire_old_subscriptions() TO service_role;

-- Trigger functions should never be callable directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_field_change() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.support_message_after_insert() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public, authenticated;

-- redeem_promo_code(text) — only authenticated users should call it
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
