-- ============================================
-- LIMPAR TODAS FUNÇÕES DUPLICADAS PRIMEIRO
-- ============================================
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(TEXT);
DROP FUNCTION IF EXISTS public.fn_list_books_for_category();

DROP FUNCTION IF EXISTS public.fn_get_book_annotations(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.fn_get_book_annotations(UUID);

DROP FUNCTION IF EXISTS public.fn_get_book_stats();

DROP FUNCTION IF EXISTS public.fn_update_reading_progress(UUID, INTEGER, INTEGER, UUID);
DROP FUNCTION IF EXISTS public.fn_update_reading_progress(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.fn_update_reading_progress(UUID, INTEGER);

-- Adicionar coluna
DO $$ BEGIN
  ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================
-- 16) fn_update_reading_progress
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_update_reading_progress(
  p_book_id UUID,
  p_current_page INTEGER,
  p_reading_time_seconds INTEGER DEFAULT 0,
  p_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_total_pages INTEGER;
  v_progress_percent NUMERIC;
  v_is_completed BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;
  
  SELECT total_pages INTO v_total_pages FROM public.web_books WHERE id = p_book_id;
  IF v_total_pages IS NULL OR v_total_pages = 0 THEN v_total_pages := 1; END IF;
  
  v_progress_percent := (p_current_page::numeric / v_total_pages::numeric) * 100;
  v_is_completed := p_current_page >= v_total_pages;
  
  INSERT INTO public.user_book_progress (user_id, book_id, current_page, last_read_at, total_reading_time_seconds, progress_percent, pages_read, is_completed, completed_at, last_session_id)
  VALUES (v_user_id, p_book_id, p_current_page, now(), p_reading_time_seconds, v_progress_percent, ARRAY[p_current_page], v_is_completed, CASE WHEN v_is_completed THEN now() ELSE NULL END, p_session_id)
  ON CONFLICT (user_id, book_id) DO UPDATE SET
    current_page = p_current_page, last_read_at = now(),
    total_reading_time_seconds = user_book_progress.total_reading_time_seconds + p_reading_time_seconds,
    progress_percent = v_progress_percent,
    pages_read = array_append(array_remove(user_book_progress.pages_read, p_current_page), p_current_page),
    updated_at = now(), is_completed = v_is_completed,
    completed_at = CASE WHEN v_is_completed AND user_book_progress.completed_at IS NULL THEN now() ELSE user_book_progress.completed_at END,
    last_session_id = COALESCE(p_session_id, user_book_progress.last_session_id);
  
  IF p_session_id IS NOT NULL THEN
    UPDATE public.book_reading_sessions SET end_page = p_current_page, heartbeat_at = now(), duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
    WHERE id = p_session_id AND user_id = v_user_id;
  END IF;
  
  INSERT INTO public.book_access_logs (user_id, book_id, page_number, event_type, session_id)
  VALUES (v_user_id, p_book_id, p_current_page, 'page_view', p_session_id::text);
  
  RETURN jsonb_build_object('success', true, 'currentPage', p_current_page, 'progressPercent', v_progress_percent, 'isCompleted', v_is_completed, 'totalPages', v_total_pages);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 17) fn_list_books_for_category
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_list_books_for_category(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_books JSONB;
  v_user_id UUID;
  v_is_owner BOOLEAN;
  v_total INTEGER;
BEGIN
  v_user_id := auth.uid();
  v_is_owner := public.fn_is_book_owner();
  
  SELECT COUNT(*) INTO v_total FROM public.web_books b
  WHERE (b.status = 'ready' OR v_is_owner) AND (COALESCE(b.is_published, false) = true OR v_is_owner)
    AND (p_category IS NULL OR b.category::text = p_category)
    AND (p_search IS NULL OR b.title ILIKE '%' || p_search || '%' OR b.description ILIKE '%' || p_search || '%');
  
  SELECT jsonb_agg(jsonb_build_object(
    'id', b.id, 'title', b.title, 'subtitle', b.subtitle, 'author', b.author, 'category', b.category,
    'totalPages', b.total_pages, 'coverUrl', b.cover_url, 'ratingAverage', b.rating_average,
    'ratingCount', b.rating_count, 'viewCount', b.view_count, 'createdAt', b.created_at, 'status', b.status,
    'isPublished', b.is_published,
    'progress', (SELECT jsonb_build_object('currentPage', COALESCE(p.current_page, 0), 'progressPercent', COALESCE(p.progress_percent, 0), 'isCompleted', COALESCE(p.is_completed, false), 'lastReadAt', p.last_read_at)
      FROM public.user_book_progress p WHERE p.user_id = v_user_id AND p.book_id = b.id)
  ) ORDER BY b.created_at DESC) INTO v_books
  FROM public.web_books b
  WHERE (b.status = 'ready' OR v_is_owner) AND (COALESCE(b.is_published, false) = true OR v_is_owner)
    AND (p_category IS NULL OR b.category::text = p_category)
    AND (p_search IS NULL OR b.title ILIKE '%' || p_search || '%' OR b.description ILIKE '%' || p_search || '%')
  ORDER BY b.created_at DESC LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object('success', true, 'books', COALESCE(v_books, '[]'::jsonb), 'total', v_total, 'limit', p_limit, 'offset', p_offset, 'hasMore', (p_offset + p_limit) < v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 18) fn_get_book_annotations
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_book_annotations(p_book_id UUID, p_page_number INTEGER DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE v_user_id UUID; v_annotations JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED'); END IF;
  
  SELECT jsonb_agg(jsonb_build_object('id', a.id, 'pageNumber', a.page_number, 'type', a.annotation_type, 'content', a.content, 'positionX', a.position_x, 'positionY', a.position_y, 'width', a.width, 'height', a.height, 'color', a.color, 'selectedText', a.selected_text, 'isFavorite', a.is_favorite, 'createdAt', a.created_at, 'updatedAt', a.updated_at) ORDER BY a.created_at DESC) INTO v_annotations
  FROM public.user_annotations a WHERE a.user_id = v_user_id AND a.book_id = p_book_id AND (p_page_number IS NULL OR a.page_number = p_page_number);
  
  RETURN jsonb_build_object('success', true, 'annotations', COALESCE(v_annotations, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 19) fn_get_book_stats
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_book_stats()
RETURNS JSONB AS $$
DECLARE v_stats JSONB;
BEGIN
  IF NOT public.fn_is_book_owner() THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;
  
  SELECT jsonb_build_object(
    'totalBooks', (SELECT COUNT(*) FROM public.web_books),
    'readyBooks', (SELECT COUNT(*) FROM public.web_books WHERE status = 'ready'),
    'publishedBooks', (SELECT COUNT(*) FROM public.web_books WHERE is_published = true),
    'totalPages', (SELECT COALESCE(SUM(total_pages), 0) FROM public.web_books),
    'totalViews', (SELECT COALESCE(SUM(view_count), 0) FROM public.web_books),
    'uniqueReaders', (SELECT COUNT(DISTINCT user_id) FROM public.user_book_progress),
    'totalAnnotations', (SELECT COUNT(*) FROM public.user_annotations),
    'totalChatMessages', (SELECT COUNT(*) FROM public.book_chat_messages),
    'avgRating', (SELECT COALESCE(AVG(rating), 0) FROM public.book_ratings),
    'avgCompletionPercent', (SELECT COALESCE(AVG(progress_percent), 0) FROM public.user_book_progress),
    'booksByCategory', (SELECT COALESCE(jsonb_object_agg(category, cnt), '{}'::jsonb) FROM (SELECT category::text, COUNT(*) as cnt FROM public.web_books GROUP BY category) sub),
    'recentViolations', (SELECT COUNT(*) FROM public.book_access_logs WHERE is_violation = true AND created_at > now() - interval '24 hours')
  ) INTO v_stats;
  
  RETURN jsonb_build_object('success', true, 'stats', v_stats);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- GRANTS para as novas funções
-- ============================================
GRANT EXECUTE ON FUNCTION public.fn_update_reading_progress(UUID, INTEGER, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_annotations(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_stats() TO authenticated;