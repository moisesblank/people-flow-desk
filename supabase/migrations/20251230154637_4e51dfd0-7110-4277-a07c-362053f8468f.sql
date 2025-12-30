-- Corrigir função fn_update_reading_progress removendo referência a last_session_id
CREATE OR REPLACE FUNCTION public.fn_update_reading_progress(
  p_book_id uuid,
  p_current_page integer,
  p_reading_time_seconds integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_total_pages integer;
  v_pages_read integer[];
  v_progress_percent numeric;
  v_is_completed boolean;
  v_result jsonb;
BEGIN
  -- Obter usuário atual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Obter total de páginas do livro
  SELECT total_pages INTO v_total_pages 
  FROM web_books 
  WHERE id = p_book_id;

  IF v_total_pages IS NULL OR v_total_pages = 0 THEN
    v_total_pages := p_current_page; -- Usar página atual como referência se não tiver total
  END IF;

  -- Calcular progresso
  v_progress_percent := LEAST(100, ROUND((p_current_page::numeric / v_total_pages::numeric) * 100, 2));
  v_is_completed := (p_current_page >= v_total_pages);

  -- Upsert do progresso
  INSERT INTO user_book_progress (
    user_id,
    book_id,
    current_page,
    last_read_at,
    total_reading_time_seconds,
    progress_percent,
    is_completed,
    completed_at,
    pages_read
  ) VALUES (
    v_user_id,
    p_book_id,
    p_current_page,
    now(),
    p_reading_time_seconds,
    v_progress_percent,
    v_is_completed,
    CASE WHEN v_is_completed THEN now() ELSE NULL END,
    ARRAY[p_current_page]
  )
  ON CONFLICT (user_id, book_id) 
  DO UPDATE SET
    current_page = GREATEST(user_book_progress.current_page, EXCLUDED.current_page),
    last_read_at = now(),
    total_reading_time_seconds = user_book_progress.total_reading_time_seconds + p_reading_time_seconds,
    progress_percent = GREATEST(user_book_progress.progress_percent, EXCLUDED.progress_percent),
    is_completed = user_book_progress.is_completed OR EXCLUDED.is_completed,
    completed_at = COALESCE(user_book_progress.completed_at, EXCLUDED.completed_at),
    pages_read = (
      SELECT array_agg(DISTINCT x ORDER BY x)
      FROM unnest(COALESCE(user_book_progress.pages_read, ARRAY[]::integer[]) || ARRAY[p_current_page]) x
    ),
    updated_at = now();

  v_result := jsonb_build_object(
    'success', true,
    'current_page', p_current_page,
    'progress_percent', v_progress_percent,
    'is_completed', v_is_completed
  );

  RETURN v_result;
END;
$$;