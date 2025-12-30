-- Atualizar fn_get_book_for_reader para incluir dados do PDF original
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
  
  -- IMPORTANTE: Permitir livros "ready" mesmo sem páginas (modo PDF direto)
  IF v_book.status != 'ready' AND NOT v_is_owner THEN
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
    'isOwner', v_is_owner,
    'pdfMode', jsonb_build_object(
      'enabled', (v_pages IS NULL OR jsonb_array_length(v_pages) = 0),
      'originalBucket', v_book.original_bucket,
      'originalPath', v_book.original_path,
      'originalFilename', v_book.original_filename
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;