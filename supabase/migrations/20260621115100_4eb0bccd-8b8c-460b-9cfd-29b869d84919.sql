-- Fix artist application submission: missing SELECT grants/policy made the
-- post-INSERT `.select()` round-trip fail with "row-level security policy"
-- and made the safe view return empty for owners.

-- 1) Grant SELECT on the non-sensitive columns of artist_applications to authenticated.
--    admin_note is intentionally excluded — it stays admin-only and is fetched
--    via the existing SECURITY DEFINER RPC get_my_artist_application_note().
GRANT SELECT (
  id, user_id, stage_name, real_name, phone, country_code, social_links,
  id_doc_type, id_doc_front_path, id_doc_back_path, selfie_path,
  artist_photo_path, status, reviewed_at, reviewed_by, created_at, updated_at,
  phone_hash, id_image_hash, face_match_score, face_match_status,
  ocr_extracted_name, name_match_score, auto_check_warnings, auto_checks_at
) ON public.artist_applications TO authenticated;

-- 2) Add the missing own-row SELECT policy so the application form, status
--    page and the post-insert `.select('id')` round-trip all work.
DROP POLICY IF EXISTS "artist_apps own select" ON public.artist_applications;
CREATE POLICY "artist_apps own select"
  ON public.artist_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);