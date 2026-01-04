-- Drop old RPCs and create new ones adapted to the CSV format
DROP FUNCTION IF EXISTS public.dry_run_lesson_video_links(jsonb);
DROP FUNCTION IF EXISTS public.apply_lesson_video_links(jsonb);

-- Dry run: validates and returns what would be updated
CREATE OR REPLACE FUNCTION public.dry_run_lesson_video_links(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_legacy_qr_id integer;
  v_provider text;
  v_youtube_id text;
  v_panda_id text;
  v_lesson_id uuid;
  v_lesson_title text;
  v_matched integer := 0;
  v_unmatched integer := 0;
  v_ambiguous integer := 0;
  v_sample_updates jsonb := '[]'::jsonb;
  v_unmatched_rows jsonb := '[]'::jsonb;
  v_count integer;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_legacy_qr_id := (v_row->>'legacy_qr_id')::integer;
    v_provider := COALESCE(v_row->>'provider', 'youtube');
    v_youtube_id := NULLIF(TRIM(v_row->>'youtube_id'), '');
    v_panda_id := NULLIF(TRIM(v_row->>'panda_id'), '');
    
    -- Auto-detect provider based on panda_id format
    -- If panda_id is a UUID (contains hyphen and is 36 chars), it's Panda
    -- Otherwise, it's likely YouTube
    IF v_panda_id IS NOT NULL AND v_panda_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_provider := 'panda';
    ELSIF v_youtube_id IS NOT NULL OR (v_panda_id IS NOT NULL AND LENGTH(v_panda_id) <= 15) THEN
      v_provider := 'youtube';
      -- If youtube_id is empty but panda_id looks like YouTube ID, use it
      IF v_youtube_id IS NULL AND v_panda_id IS NOT NULL THEN
        v_youtube_id := v_panda_id;
      END IF;
    END IF;
    
    -- Find lesson by legacy_qr_id
    SELECT COUNT(*) INTO v_count FROM lessons WHERE legacy_qr_id = v_legacy_qr_id;
    
    IF v_count = 0 THEN
      v_unmatched := v_unmatched + 1;
      v_unmatched_rows := v_unmatched_rows || jsonb_build_object(
        'legacy_qr_id', v_legacy_qr_id,
        'title', v_row->>'title',
        'reason', 'legacy_qr_id not found'
      );
    ELSIF v_count > 1 THEN
      v_ambiguous := v_ambiguous + 1;
      v_unmatched_rows := v_unmatched_rows || jsonb_build_object(
        'legacy_qr_id', v_legacy_qr_id,
        'title', v_row->>'title',
        'reason', 'multiple lessons with same legacy_qr_id'
      );
    ELSE
      v_matched := v_matched + 1;
      
      -- Get lesson info for sample
      SELECT id, title INTO v_lesson_id, v_lesson_title 
      FROM lessons WHERE legacy_qr_id = v_legacy_qr_id;
      
      -- Add to sample (max 10)
      IF jsonb_array_length(v_sample_updates) < 10 THEN
        v_sample_updates := v_sample_updates || jsonb_build_object(
          'lesson_id', v_lesson_id,
          'lesson_title', v_lesson_title,
          'legacy_qr_id', v_legacy_qr_id,
          'provider', v_provider,
          'youtube_id', v_youtube_id,
          'panda_id', v_panda_id
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_rows', jsonb_array_length(p_rows),
    'matched', v_matched,
    'unmatched', v_unmatched,
    'ambiguous', v_ambiguous,
    'sample_updates', v_sample_updates,
    'unmatched_rows', v_unmatched_rows
  );
END;
$$;

-- Apply: actually updates the lessons
CREATE OR REPLACE FUNCTION public.apply_lesson_video_links(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_legacy_qr_id integer;
  v_provider text;
  v_youtube_id text;
  v_panda_id text;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_count integer;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_legacy_qr_id := (v_row->>'legacy_qr_id')::integer;
    v_provider := COALESCE(v_row->>'provider', 'youtube');
    v_youtube_id := NULLIF(TRIM(v_row->>'youtube_id'), '');
    v_panda_id := NULLIF(TRIM(v_row->>'panda_id'), '');
    
    -- Auto-detect provider based on panda_id format
    IF v_panda_id IS NOT NULL AND v_panda_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_provider := 'panda';
    ELSIF v_youtube_id IS NOT NULL OR (v_panda_id IS NOT NULL AND LENGTH(v_panda_id) <= 15) THEN
      v_provider := 'youtube';
      IF v_youtube_id IS NULL AND v_panda_id IS NOT NULL THEN
        v_youtube_id := v_panda_id;
      END IF;
    END IF;
    
    -- Check if exactly one lesson exists
    SELECT COUNT(*) INTO v_count FROM lessons WHERE legacy_qr_id = v_legacy_qr_id;
    
    IF v_count = 1 THEN
      UPDATE lessons
      SET 
        video_provider = v_provider,
        youtube_video_id = CASE WHEN v_provider = 'youtube' THEN COALESCE(v_youtube_id, v_panda_id) ELSE NULL END,
        panda_video_id = CASE WHEN v_provider = 'panda' THEN v_panda_id ELSE NULL END,
        video_url = CASE 
          WHEN v_provider = 'youtube' THEN 'https://www.youtube.com/watch?v=' || COALESCE(v_youtube_id, v_panda_id)
          WHEN v_provider = 'panda' THEN 'https://player-vz-7b4690a0-a6d.tv.pandavideo.com.br/embed/?v=' || v_panda_id
          ELSE NULL
        END,
        updated_at = now()
      WHERE legacy_qr_id = v_legacy_qr_id;
      
      v_updated := v_updated + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_rows', jsonb_array_length(p_rows),
    'updated', v_updated,
    'skipped', v_skipped
  );
END;
$$;