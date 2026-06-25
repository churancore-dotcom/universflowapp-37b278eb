
-- 1) Fix follower throttle bug: the INSERT path was setting last_notified_at = now()
--    which immediately tripped the "within 30 min" guard, so the very first new
--    follower never produced a push. Use epoch on insert instead.
CREATE OR REPLACE FUNCTION public.on_artist_follower_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last timestamptz;
  v_follower_name text;
  v_extra int;
BEGIN
  IF NEW.follower_user_id = NEW.artist_user_id THEN RETURN NEW; END IF;

  INSERT INTO public.artist_push_throttle(artist_user_id, event_kind, last_notified_at, count_since_last)
  VALUES (NEW.artist_user_id, 'new_follower', 'epoch'::timestamptz, 1)
  ON CONFLICT (artist_user_id, event_kind) DO UPDATE
    SET count_since_last = public.artist_push_throttle.count_since_last + 1
  RETURNING last_notified_at INTO v_last;

  IF v_last > now() - interval '30 minutes' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(username, 'Someone') INTO v_follower_name
    FROM public.profiles WHERE user_id = NEW.follower_user_id;

  SELECT count_since_last INTO v_extra
    FROM public.artist_push_throttle
    WHERE artist_user_id = NEW.artist_user_id AND event_kind = 'new_follower';

  PERFORM public.notify_system_push(
    ARRAY[NEW.artist_user_id],
    CASE WHEN v_extra > 1 THEN '🎉 ' || v_extra::text || ' new followers'
         ELSE '🎉 New follower' END,
    CASE WHEN v_extra > 1 THEN v_follower_name || ' and ' || (v_extra-1)::text || ' more started following you'
         ELSE v_follower_name || ' started following you' END,
    '/artist/followers'
  );

  UPDATE public.artist_push_throttle
    SET last_notified_at = now(), count_since_last = 0
    WHERE artist_user_id = NEW.artist_user_id AND event_kind = 'new_follower';
  RETURN NEW;
END $function$;

-- 2) Push the artist when their application is approved/rejected.
--    Done in a dedicated AFTER trigger so we don't depend on the BEFORE
--    trigger ordering. Uses notify_system_push which is service-role only.
CREATE OR REPLACE FUNCTION public.on_artist_application_decision_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'approved' THEN
    BEGIN
      PERFORM public.notify_system_push(
        ARRAY[NEW.user_id]::uuid[],
        '✓ You''re verified on Universflow',
        'Welcome to the Artist Studio. Tap to open your dashboard.',
        '/artist/studio'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'approval push failed: %', SQLERRM;
    END;
  ELSIF NEW.status = 'rejected' THEN
    BEGIN
      PERFORM public.notify_system_push(
        ARRAY[NEW.user_id]::uuid[],
        'Verification update',
        'Your artist verification needs another look. Tap to view the notes.',
        '/artist/status'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'rejection push failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_artist_app_decision_push ON public.artist_applications;
CREATE TRIGGER trg_artist_app_decision_push
  AFTER UPDATE OF status ON public.artist_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_artist_application_decision_push();

-- 3) Notify the artist when a fan adds one of their songs to their library
--    (closest equivalent to a "like" in this app). Throttled to one push
--    per 30 minutes per artist with a rolling count.
CREATE OR REPLACE FUNCTION public.on_user_library_artist_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_artist uuid;
  v_title  text;
  v_last   timestamptz;
  v_fan    text;
  v_extra  int;
BEGIN
  -- Resolve artist_user_id only if song_id matches an artist_songs row.
  -- artist_songs.id is uuid; user_library.song_id is text — guard the cast.
  IF NEW.song_id IS NULL OR NEW.song_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN NEW;
  END IF;

  SELECT artist_user_id, title INTO v_artist, v_title
    FROM public.artist_songs WHERE id = NEW.song_id::uuid AND status = 'live'::public.artist_song_status;
  IF v_artist IS NULL OR v_artist = NEW.user_id THEN RETURN NEW; END IF;

  INSERT INTO public.artist_push_throttle(artist_user_id, event_kind, last_notified_at, count_since_last)
  VALUES (v_artist, 'new_like', 'epoch'::timestamptz, 1)
  ON CONFLICT (artist_user_id, event_kind) DO UPDATE
    SET count_since_last = public.artist_push_throttle.count_since_last + 1
  RETURNING last_notified_at INTO v_last;

  IF v_last > now() - interval '30 minutes' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(username, 'Someone') INTO v_fan
    FROM public.profiles WHERE user_id = NEW.user_id;

  SELECT count_since_last INTO v_extra
    FROM public.artist_push_throttle
    WHERE artist_user_id = v_artist AND event_kind = 'new_like';

  BEGIN
    PERFORM public.notify_system_push(
      ARRAY[v_artist]::uuid[],
      CASE WHEN v_extra > 1 THEN '❤️ ' || v_extra::text || ' new saves'
           ELSE '❤️ Someone saved your track' END,
      CASE WHEN v_extra > 1 THEN v_fan || ' and ' || (v_extra-1)::text || ' more saved your music'
           ELSE v_fan || ' added "' || COALESCE(v_title,'your song') || '" to their library' END,
      '/artist/studio'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'like push failed: %', SQLERRM;
  END;

  UPDATE public.artist_push_throttle
    SET last_notified_at = now(), count_since_last = 0
    WHERE artist_user_id = v_artist AND event_kind = 'new_like';

  -- Keep aggregate like_count in sync so the artist dashboard reflects saves.
  UPDATE public.artist_songs SET like_count = like_count + 1 WHERE id = NEW.song_id::uuid;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_user_library_artist_like ON public.user_library;
CREATE TRIGGER trg_user_library_artist_like
  AFTER INSERT ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.on_user_library_artist_like();
