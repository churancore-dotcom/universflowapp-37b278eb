DROP POLICY IF EXISTS "Admins can upload music files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update music files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete music files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload cover images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update cover images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete cover images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload music" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update music" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete music" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete covers" ON storage.objects;

CREATE POLICY "Admins can upload music files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'music' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update music files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'music' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'music' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete music files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'music' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can upload cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update cover images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete cover images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND subscription_type = 'free'::public.subscription_type
  AND status = 'active'::public.subscription_status
  AND platform = 'web'::public.subscription_platform
  AND expires_at IS NULL
  AND purchase_token IS NULL
  AND transaction_id IS NULL
);

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.song_reactions;
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON public.song_reactions;
CREATE POLICY "Authenticated users can view reactions"
ON public.song_reactions
FOR SELECT
TO authenticated
USING (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'promo_codes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.promo_codes';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'song_requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.song_requests';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;