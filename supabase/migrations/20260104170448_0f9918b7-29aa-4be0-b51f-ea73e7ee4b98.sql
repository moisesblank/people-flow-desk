-- Video links importer (transactional, dry-run + apply)
-- Patch-only: adds RPC functions; no table changes.

CREATE OR REPLACE FUNCTION public.dry_run_lesson_video_links(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int := 0;
  v_matched int := 0;
  v_unmatched int := 0;
  v_ambiguous int := 0;
  v_row jsonb;
  v_lesson_id uuid;
  v_module_id uuid;
  v_title text;
  v_video_url text;
  v_video_provider text;
  v_found uuid;
  v_count int;
  v_unmatched_rows jsonb := '[]'::jsonb;
  v_ambiguous_rows jsonb := '[]'::jsonb;
  v_sample_updates jsonb := '[]'::jsonb;
BEGIN
  -- Access control (gestão staff or owner)
  IF NOT (public.is_gestao_staff(auth.uid()) OR public.is_owner(auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_INPUT', 'message', 'p_rows must be a JSON array');
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_total := v_total + 1;

    v_lesson_id := NULLIF(v_row->>'lesson_id','')::uuid;
    v_module_id := NULLIF(v_row->>'module_id','')::uuid;
    v_title := NULLIF(v_row->>'lesson_title','');
    v_video_url := NULLIF(v_row->>'video_url','');
    v_video_provider := NULLIF(v_row->>'video_provider','');

    -- Basic validation
    IF v_video_url IS NULL OR v_video_provider IS NULL THEN
      v_unmatched := v_unmatched + 1;
      v_unmatched_rows := v_unmatched_rows || jsonb_build_array(jsonb_build_object(
        'row', v_row,
        'reason', 'MISSING_VIDEO_FIELDS'
      ));
      CONTINUE;
    END IF;

    IF v_video_provider NOT IN ('panda','youtube','vimeo','upload') THEN
      v_unmatched := v_unmatched + 1;
      v_unmatched_rows := v_unmatched_rows || jsonb_build_array(jsonb_build_object(
        'row', v_row,
        'reason', 'INVALID_VIDEO_PROVIDER'
      ));
      CONTINUE;
    END IF;

    -- Match strategy: lesson_id first, fallback title+module_id
    IF v_lesson_id IS NOT NULL THEN
      SELECT l.id INTO v_found
      FROM public.lessons l
      WHERE l.id = v_lesson_id;

      IF v_found IS NULL THEN
        v_unmatched := v_unmatched + 1;
        v_unmatched_rows := v_unmatched_rows || jsonb_build_array(jsonb_build_object(
          'row', v_row,
          'reason', 'LESSON_ID_NOT_FOUND'
        ));
        CONTINUE;
      END IF;

    ELSE
      IF v_module_id IS NULL OR v_title IS NULL THEN
        v_unmatched := v_unmatched + 1;
        v_unmatched_rows := v_unmatched_rows || jsonb_build_array(jsonb_build_object(
          'row', v_row,
          'reason', 'MISSING_MATCH_KEYS'
        ));
        CONTINUE;
      END IF;

      SELECT count(*), min(l.id)
      INTO v_count, v_found
      FROM public.lessons l
      WHERE l.module_id = v_module_id AND l.title = v_title;

      IF v_count = 0 THEN
        v_unmatched := v_unmatched + 1;
        v_unmatched_rows := v_unmatched_rows || jsonb_build_array(jsonb_build_object(
          'row', v_row,
          'reason', 'TITLE_NOT_FOUND_IN_MODULE'
        ));
        CONTINUE;
      ELSIF v_count > 1 THEN
        v_ambiguous := v_ambiguous + 1;
        v_ambiguous_rows := v_ambiguous_rows || jsonb_build_array(jsonb_build_object(
          'row', v_row,
          'reason', 'AMBIGUOUS_TITLE_IN_MODULE',
          'count', v_count
        ));
        CONTINUE;
      END IF;
    END IF;

    v_matched := v_matched + 1;

    -- Keep up to 25 samples
    IF jsonb_array_length(v_sample_updates) < 25 THEN
      v_sample_updates := v_sample_updates || jsonb_build_array(jsonb_build_object(
        'lesson_id', v_found,
        'video_provider', v_video_provider,
        'video_url', v_video_url
      ));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_rows', v_total,
    'matched_lessons', v_matched,
    'unmatched_rows', v_unmatched,
    'ambiguous_rows', v_ambiguous,
    'unmatched', v_unmatched_rows,
    'ambiguous', v_ambiguous_rows,
    'sample_updates', v_sample_updates
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.apply_lesson_video_links(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_lesson_id uuid;
  v_module_id uuid;
  v_title text;
  v_video_url text;
  v_video_provider text;
  v_found uuid;
  v_count int;
  v_updated int := 0;
BEGIN
  -- Access control (gestão staff or owner)
  IF NOT (public.is_gestao_staff(auth.uid()) OR public.is_owner(auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_INPUT', 'message', 'p_rows must be a JSON array');
  END IF;

  -- Atomic behavior: any raise => whole function aborts
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_lesson_id := NULLIF(v_row->>'lesson_id','')::uuid;
    v_module_id := NULLIF(v_row->>'module_id','')::uuid;
    v_title := NULLIF(v_row->>'lesson_title','');
    v_video_url := NULLIF(v_row->>'video_url','');
    v_video_provider := NULLIF(v_row->>'video_provider','');

    IF v_video_url IS NULL OR v_video_provider IS NULL THEN
      RAISE EXCEPTION 'MISSING_VIDEO_FIELDS: %', v_row;
    END IF;

    IF v_video_provider NOT IN ('panda','youtube','vimeo','upload') THEN
      RAISE EXCEPTION 'INVALID_VIDEO_PROVIDER: %', v_row;
    END IF;

    -- Match
    IF v_lesson_id IS NOT NULL THEN
      SELECT l.id INTO v_found
      FROM public.lessons l
      WHERE l.id = v_lesson_id;

      IF v_found IS NULL THEN
        RAISE EXCEPTION 'LESSON_ID_NOT_FOUND: %', v_row;
      END IF;
    ELSE
      IF v_module_id IS NULL OR v_title IS NULL THEN
        RAISE EXCEPTION 'MISSING_MATCH_KEYS: %', v_row;
      END IF;

      SELECT count(*), min(l.id)
      INTO v_count, v_found
      FROM public.lessons l
      WHERE l.module_id = v_module_id AND l.title = v_title;

      IF v_count = 0 THEN
        RAISE EXCEPTION 'TITLE_NOT_FOUND_IN_MODULE: %', v_row;
      ELSIF v_count > 1 THEN
        RAISE EXCEPTION 'AMBIGUOUS_TITLE_IN_MODULE (count=%): %', v_count, v_row;
      END IF;
    END IF;

    -- Apply ONLY allowed fields
    UPDATE public.lessons
    SET
      video_url = v_video_url,
      video_provider = v_video_provider,
      updated_at = now()
    WHERE id = v_found;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'UPDATE_FAILED: %', v_row;
    END IF;

    v_updated := v_updated + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;
