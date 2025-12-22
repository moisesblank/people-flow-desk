-- ============================================
-- 🔒 CORREÇÃO DE SEGURANÇA: SET search_path
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.email() = 'moisesblank@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_is_beta_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.fn_is_owner()
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('beta', 'admin', 'funcionario')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_get_book_for_reader(p_book_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_book RECORD;
  v_user_id UUID;
  v_user_email TEXT;
  v_user_cpf TEXT;
  v_user_name TEXT;
  v_is_owner BOOLEAN;
  v_has_access BOOLEAN;
  v_progress RECORD;
  v_pages JSONB;
BEGIN
  v_user_id := auth.uid();
  
  SELECT u.email, p.cpf, p.nome INTO v_user_email, v_user_cpf, v_user_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = v_user_id;
  
  v_is_owner := LOWER(v_user_email) = 'moisesblank@gmail.com';
  
  SELECT * INTO v_book FROM public.web_books WHERE id = p_book_id;
  
  IF v_book IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOK_NOT_FOUND');
  END IF;
  
  IF v_book.status != 'ready' THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOK_NOT_READY', 'status', v_book.status);
  END IF;
  
  v_has_access := v_is_owner OR public.fn_is_beta_or_owner();
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACCESS_DENIED');
  END IF;
  
  SELECT * INTO v_progress FROM public.user_book_progress
  WHERE user_id = v_user_id AND book_id = p_book_id;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'pageNumber', page_number,
      'imagePath', image_path,
      'thumbnailPath', thumbnail_path,
      'chapterTitle', chapter_title,
      'sectionTitle', section_title,
      'width', width,
      'height', height
    ) ORDER BY page_number
  ) INTO v_pages
  FROM public.web_book_pages
  WHERE book_id = p_book_id;
  
  INSERT INTO public.book_access_logs (user_id, user_email, user_cpf, book_id, event_type, session_id)
  VALUES (v_user_id, v_user_email, v_user_cpf, p_book_id, 'book_opened', gen_random_uuid()::text);
  
  UPDATE public.web_books SET view_count = view_count + 1, updated_at = now() WHERE id = p_book_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'book', jsonb_build_object(
      'id', v_book.id,
      'title', v_book.title,
      'subtitle', v_book.subtitle,
      'author', v_book.author,
      'category', v_book.category,
      'totalPages', v_book.total_pages,
      'summary', v_book.summary,
      'coverUrl', v_book.cover_url,
      'description', v_book.description
    ),
    'pages', COALESCE(v_pages, '[]'::jsonb),
    'progress', jsonb_build_object(
      'currentPage', COALESCE(v_progress.current_page, 1),
      'progressPercent', COALESCE(v_progress.progress_percent, 0),
      'totalReadingTime', COALESCE(v_progress.total_reading_time_seconds, 0),
      'pagesRead', COALESCE(v_progress.pages_read, ARRAY[]::INTEGER[])
    ),
    'watermark', jsonb_build_object(
      'enabled', v_book.watermark_enabled,
      'userName', v_user_name,
      'userEmail', v_user_email,
      'userCpf', v_user_cpf,
      'userId', v_user_id,
      'seed', encode(digest(v_user_id::text || v_book.id::text || now()::text, 'sha256'), 'hex')
    ),
    'isOwner', v_is_owner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
      'viewCount', b.view_count,
      'progress', (
        SELECT jsonb_build_object(
          'currentPage', COALESCE(p.current_page, 0),
          'progressPercent', COALESCE(p.progress_percent, 0),
          'isCompleted', COALESCE(p.is_completed, false)
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
    'books', COALESCE(v_books, '[]'::jsonb),
    'totalCount', (SELECT COUNT(*) FROM public.web_books WHERE status = 'ready')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_get_user_annotations(p_book_id UUID, p_page_number INTEGER DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_annotations JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'pageNumber', a.page_number,
      'type', a.annotation_type,
      'content', a.content,
      'positionX', a.position_x,
      'positionY', a.position_y,
      'width', a.width,
      'height', a.height,
      'color', a.color,
      'createdAt', a.created_at
    ) ORDER BY a.created_at DESC
  ) INTO v_annotations
  FROM public.user_annotations a
  WHERE a.user_id = auth.uid()
    AND a.book_id = p_book_id
    AND a.is_deleted = false
    AND (p_page_number IS NULL OR a.page_number = p_page_number);
  
  RETURN jsonb_build_object(
    'success', true,
    'annotations', COALESCE(v_annotations, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_delete_annotation(p_annotation_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.user_annotations
  SET is_deleted = true, updated_at = now()
  WHERE id = p_annotation_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ANNOTATION_NOT_FOUND');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'deleted', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_update_web_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;