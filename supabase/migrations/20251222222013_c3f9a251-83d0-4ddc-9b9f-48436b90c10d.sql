-- ============================================
-- LIVROS DO MOISA — ADAPTAÇÃO PARTE 3 (FINAL)
-- ============================================

-- 1) ATUALIZAR FUNÇÕES COM search_path

-- fn_save_annotation
CREATE OR REPLACE FUNCTION public.fn_save_annotation(
  p_book_id UUID,
  p_page_number INTEGER,
  p_annotation_type TEXT,
  p_content TEXT DEFAULT NULL,
  p_drawing_data BYTEA DEFAULT NULL,
  p_position_x NUMERIC DEFAULT NULL,
  p_position_y NUMERIC DEFAULT NULL,
  p_width NUMERIC DEFAULT NULL,
  p_height NUMERIC DEFAULT NULL,
  p_color TEXT DEFAULT '#FFD700',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_annotation_id UUID;
  v_page_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;
  
  SELECT id INTO v_page_id FROM public.web_book_pages
  WHERE book_id = p_book_id AND page_number = p_page_number;
  
  INSERT INTO public.user_annotations (
    user_id, book_id, page_id, page_number,
    annotation_type, content, drawing_data,
    position_x, position_y, width, height,
    color, metadata
  ) VALUES (
    v_user_id, p_book_id, v_page_id, p_page_number,
    p_annotation_type::annotation_type, p_content, p_drawing_data,
    p_position_x, p_position_y, p_width, p_height,
    p_color, p_metadata
  )
  RETURNING id INTO v_annotation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'annotationId', v_annotation_id,
    'saved', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- fn_update_reading_progress
CREATE OR REPLACE FUNCTION public.fn_update_reading_progress(
  p_book_id UUID,
  p_current_page INTEGER,
  p_reading_time_seconds INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_total_pages INTEGER;
  v_progress_percent NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;
  
  SELECT total_pages INTO v_total_pages FROM public.web_books WHERE id = p_book_id;
  
  IF v_total_pages IS NULL OR v_total_pages = 0 THEN
    v_total_pages := 1;
  END IF;
  
  v_progress_percent := (p_current_page::numeric / v_total_pages::numeric) * 100;
  
  INSERT INTO public.user_book_progress (
    user_id, book_id, current_page, last_read_at, 
    total_reading_time_seconds, progress_percent, pages_read
  ) VALUES (
    v_user_id, p_book_id, p_current_page, now(),
    p_reading_time_seconds, v_progress_percent, ARRAY[p_current_page]
  )
  ON CONFLICT (user_id, book_id) DO UPDATE SET
    current_page = p_current_page,
    last_read_at = now(),
    total_reading_time_seconds = user_book_progress.total_reading_time_seconds + p_reading_time_seconds,
    progress_percent = v_progress_percent,
    pages_read = array_append(
      array_remove(user_book_progress.pages_read, p_current_page),
      p_current_page
    ),
    updated_at = now(),
    is_completed = (p_current_page >= v_total_pages),
    completed_at = CASE WHEN p_current_page >= v_total_pages THEN now() ELSE user_book_progress.completed_at END;
  
  RETURN jsonb_build_object(
    'success', true,
    'currentPage', p_current_page,
    'progressPercent', v_progress_percent,
    'isCompleted', (p_current_page >= v_total_pages)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- fn_list_books_for_category
CREATE OR REPLACE FUNCTION public.fn_list_books_for_category(p_category TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_books JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'title', b.title,
      'subtitle', b.subtitle,
      'author', b.author,
      'category', b.category,
      'totalPages', b.total_pages,
      'coverUrl', b.cover_url,
      'progress', (
        SELECT jsonb_build_object(
          'currentPage', COALESCE(p.current_page, 0),
          'progressPercent', COALESCE(p.progress_percent, 0)
        )
        FROM public.user_book_progress p
        WHERE p.user_id = v_user_id AND p.book_id = b.id
      )
    ) ORDER BY b.created_at DESC
  ) INTO v_books
  FROM public.web_books b
  WHERE b.status = 'ready'
  AND (p_category IS NULL OR b.category::text = p_category);
  
  RETURN jsonb_build_object(
    'success', true,
    'books', COALESCE(v_books, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2) RLS POLICIES (recriar para garantir consistência)
ALTER TABLE public.web_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_access_logs ENABLE ROW LEVEL SECURITY;

-- web_books
DROP POLICY IF EXISTS "web_books_owner_all" ON public.web_books;
CREATE POLICY "web_books_owner_all" ON public.web_books
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

DROP POLICY IF EXISTS "web_books_beta_read" ON public.web_books;
CREATE POLICY "web_books_beta_read" ON public.web_books
  FOR SELECT TO authenticated
  USING (status = 'ready' AND public.fn_is_beta_or_owner());

-- web_book_pages
DROP POLICY IF EXISTS "web_book_pages_owner_all" ON public.web_book_pages;
CREATE POLICY "web_book_pages_owner_all" ON public.web_book_pages
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

DROP POLICY IF EXISTS "web_book_pages_beta_read" ON public.web_book_pages;
CREATE POLICY "web_book_pages_beta_read" ON public.web_book_pages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.web_books b
      WHERE b.id = book_id AND b.status = 'ready'
    ) AND public.fn_is_beta_or_owner()
  );

-- user_book_progress
DROP POLICY IF EXISTS "user_book_progress_own" ON public.user_book_progress;
CREATE POLICY "user_book_progress_own" ON public.user_book_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- user_annotations
DROP POLICY IF EXISTS "user_annotations_own" ON public.user_annotations;
CREATE POLICY "user_annotations_own" ON public.user_annotations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- book_chat_messages
DROP POLICY IF EXISTS "book_chat_own" ON public.book_chat_messages;
CREATE POLICY "book_chat_own" ON public.book_chat_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- book_access_logs
DROP POLICY IF EXISTS "book_access_logs_admin" ON public.book_access_logs;
CREATE POLICY "book_access_logs_admin" ON public.book_access_logs
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

-- 3) GRANTS
GRANT EXECUTE ON FUNCTION public.fn_is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_beta_or_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_for_reader(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_save_annotation(UUID, INTEGER, TEXT, TEXT, BYTEA, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_reading_progress(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_user_annotations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_delete_annotation(UUID) TO authenticated;

GRANT SELECT ON public.web_books TO authenticated;
GRANT SELECT ON public.web_book_pages TO authenticated;
GRANT ALL ON public.user_book_progress TO authenticated;
GRANT ALL ON public.user_annotations TO authenticated;
GRANT ALL ON public.book_chat_messages TO authenticated;