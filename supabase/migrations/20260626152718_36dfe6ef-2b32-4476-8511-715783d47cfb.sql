
-- Purge all demo/test artist accounts and their content
DELETE FROM public.artist_songs WHERE artist_user_id IN (
  '72c7da06-99b2-4c9f-92b0-9db0931c3882',
  'b709de28-0915-47c0-b011-6f6634088790',
  '50ff96be-fc97-43a5-aa6f-1e8e0c90218f',
  '3c0eab0c-6f5c-4cef-ad0b-14ab51ab2ded'
);
DELETE FROM public.artist_followers WHERE artist_user_id IN (
  '72c7da06-99b2-4c9f-92b0-9db0931c3882',
  'b709de28-0915-47c0-b011-6f6634088790',
  '50ff96be-fc97-43a5-aa6f-1e8e0c90218f',
  '3c0eab0c-6f5c-4cef-ad0b-14ab51ab2ded'
);
DELETE FROM public.artist_profiles WHERE user_id IN (
  '72c7da06-99b2-4c9f-92b0-9db0931c3882',
  'b709de28-0915-47c0-b011-6f6634088790',
  '50ff96be-fc97-43a5-aa6f-1e8e0c90218f',
  '3c0eab0c-6f5c-4cef-ad0b-14ab51ab2ded'
);
