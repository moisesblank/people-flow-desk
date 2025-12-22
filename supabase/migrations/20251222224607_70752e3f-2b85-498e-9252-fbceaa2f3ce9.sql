-- ============================================
-- 🌌 LIVROS DO MOISA — PARTE 3: FUNÇÕES DO READER
-- ============================================

-- ============================================
-- 14) FUNÇÃO: fn_get_book_for_reader()
-- Retorna livro para o leitor com verificação de acesso
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_book_for_reader(p_book_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_book RECORD;
  v_user_id UUID;
  v_user_email TEXT;
  v_user_cpf TEXT;
  v_user_name TEXT;
  v_user_role TEXT;
  v_is_owner BOOLEAN;
  v_has_access BOOLEAN;
  v_progress RECORD;
  v_pages JSONB;
  v_session_id UUID;
  v_watermark_seed TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'errorCode', 'UNAUTHORIZED');
  END IF;
  
  -- Buscar dados do usuário
  SELECT 
    COALESCE(p.email, u.email) as email,
    p.cpf,
    p.nome as name,
    ur.role::text as user_role
  INTO v_user_email, v_user_cpf, v_user_name, v_user_role
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.id = v_user_id;
  
  -- Verificar owner
  v_is_owner := LOWER(v_user_email) = 'moisesblank@gmail.com' OR v_user_role = 'owner';
  
  -- Buscar livro
  SELECT * INTO v_book FROM public.web_books WHERE id = p_book_id;
  
  IF v_book IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Livro não encontrado', 'errorCode', 'NOT_FOUND');
  END IF;
  
  IF v_book.status != 'ready' AND NOT v_is_owner THEN
    RETURN jsonb_build_object('success', false, 'error', 'Livro não disponível', 'errorCode', 'NOT_READY', 'status', v_book.status);
  END IF;
  
  -- Verificar acesso
  v_has_access := v_is_owner OR v_user_role IN ('beta', 'admin', 'funcionario');
  
  IF NOT v_has_access THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado', 'errorCode', 'UNAUTHORIZED');
  END IF;
  
  -- Buscar progresso
  SELECT * INTO v_progress FROM public.user_book_progress
  WHERE user_id = v_user_id AND book_id = p_book_id;
  
  -- Buscar páginas (metadados apenas)
  SELECT jsonb_agg(
    jsonb_build_object(
      'pageNumber', page_number,
      'imagePath', image_path,
      'chapterTitle', chapter_title,
      'chapterNumber', chapter_number,
      'sectionTitle', section_title,
      'width', width,
      'height', height
    ) ORDER BY page_number
  ) INTO v_pages
  FROM public.web_book_pages
  WHERE book_id = p_book_id;
  
  -- Gerar session ID e watermark seed
  v_session_id := gen_random_uuid();
  v_watermark_seed := encode(sha256((v_user_id::text || v_session_id::text || now()::text)::bytea), 'hex');
  
  -- Criar sessão de leitura
  INSERT INTO public.book_reading_sessions (id, user_id, book_id, start_page)
  VALUES (v_session_id, v_user_id, p_book_id, COALESCE(v_progress.current_page, 1))
  ON CONFLICT DO NOTHING;
  
  -- Logar acesso
  INSERT INTO public.book_access_logs (
    user_id, user_email, user_cpf, user_name, user_role,
    book_id, book_title, event_type, session_id
  )
  VALUES (
    v_user_id, v_user_email, v_user_cpf, v_user_name, v_user_role,
    p_book_id, v_book.title, 'book_opened', v_session_id::text
  );
  
  -- Atualizar view count
  UPDATE public.web_books SET view_count = view_count + 1, updated_at = now() WHERE id = p_book_id;
  
  -- Criar ou atualizar progresso
  INSERT INTO public.user_book_progress (user_id, book_id, current_page, last_read_at, last_session_id)
  VALUES (v_user_id, p_book_id, 1, now(), v_session_id)
  ON CONFLICT (user_id, book_id) DO UPDATE SET
    last_read_at = now(),
    session_count = user_book_progress.session_count + 1,
    last_session_id = v_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'book', jsonb_build_object(
      'id', v_book.id,
      'title', v_book.title,
      'subtitle', v_book.subtitle,
      'description', v_book.description,
      'author', v_book.author,
      'category', v_book.category,
      'totalPages', v_book.total_pages,
      'summary', v_book.summary,
      'tableOfContents', v_book.table_of_contents,
      'coverUrl', v_book.cover_url,
      'allowAnnotations', v_book.allow_annotations,
      'allowChat', v_book.allow_chat
    ),
    'pages', COALESCE(v_pages, '[]'::jsonb),
    'progress', jsonb_build_object(
      'currentPage', COALESCE(v_progress.current_page, 1),
      'progressPercent', COALESCE(v_progress.progress_percent, 0),
      'totalReadingTime', COALESCE(v_progress.total_reading_time_seconds, 0),
      'isCompleted', COALESCE(v_progress.is_completed, false),
      'zoomLevel', COALESCE(v_progress.zoom_level, 100),
      'displayMode', COALESCE(v_progress.display_mode, 'single')
    ),
    'session', jsonb_build_object(
      'id', v_session_id,
      'watermarkSeed', v_watermark_seed
    ),
    'watermark', jsonb_build_object(
      'enabled', v_book.watermark_enabled AND NOT v_is_owner,
      'userEmail', v_user_email,
      'userCpf', v_user_cpf,
      'userName', v_user_name,
      'userId', v_user_id
    ),
    'isOwner', v_is_owner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 15) FUNÇÃO: fn_save_book_annotation()
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_save_book_annotation(
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
  p_selected_text TEXT DEFAULT NULL,
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
  
  -- Verificar acesso ao livro
  IF NOT EXISTS (
    SELECT 1 FROM public.web_books b
    WHERE b.id = p_book_id AND b.allow_annotations = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ANNOTATIONS_DISABLED');
  END IF;
  
  -- Buscar page_id
  SELECT id INTO v_page_id FROM public.web_book_pages
  WHERE book_id = p_book_id AND page_number = p_page_number;
  
  -- Inserir anotação
  INSERT INTO public.user_annotations (
    user_id, book_id, page_id, page_number,
    annotation_type, content, drawing_data,
    position_x, position_y, width, height,
    color, selected_text, metadata
  ) VALUES (
    v_user_id, p_book_id, v_page_id, p_page_number,
    p_annotation_type::annotation_type, p_content, p_drawing_data,
    p_position_x, p_position_y, p_width, p_height,
    p_color, p_selected_text, p_metadata
  )
  RETURNING id INTO v_annotation_id;
  
  -- Atualizar contadores
  UPDATE public.user_book_progress
  SET 
    annotations_count = annotations_count + 1,
    updated_at = now()
  WHERE user_id = v_user_id AND book_id = p_book_id;
  
  UPDATE public.web_books
  SET total_annotations = total_annotations + 1
  WHERE id = p_book_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'annotationId', v_annotation_id,
    'saved', true,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 16) FUNÇÃO: fn_update_reading_progress()
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
  
  -- Buscar total de páginas
  SELECT total_pages INTO v_total_pages FROM public.web_books WHERE id = p_book_id;
  
  IF v_total_pages IS NULL OR v_total_pages = 0 THEN
    v_total_pages := 1;
  END IF;
  
  -- Calcular progresso
  v_progress_percent := (p_current_page::numeric / v_total_pages::numeric) * 100;
  v_is_completed := p_current_page >= v_total_pages;
  
  -- Upsert progresso
  INSERT INTO public.user_book_progress (
    user_id, book_id, current_page, last_read_at, 
    total_reading_time_seconds, progress_percent, pages_read,
    is_completed, completed_at, last_session_id
  ) VALUES (
    v_user_id, p_book_id, p_current_page, now(),
    p_reading_time_seconds, v_progress_percent, ARRAY[p_current_page],
    v_is_completed, CASE WHEN v_is_completed THEN now() ELSE NULL END,
    p_session_id
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
    pages_visited = (
      SELECT COUNT(DISTINCT unnest) FROM unnest(
        array_append(user_book_progress.pages_read, p_current_page)
      )
    ),
    updated_at = now(),
    is_completed = v_is_completed,
    completed_at = CASE 
      WHEN v_is_completed AND user_book_progress.completed_at IS NULL THEN now() 
      ELSE user_book_progress.completed_at 
    END,
    last_session_id = COALESCE(p_session_id, user_book_progress.last_session_id);
  
  -- Atualizar sessão de leitura
  IF p_session_id IS NOT NULL THEN
    UPDATE public.book_reading_sessions
    SET 
      end_page = p_current_page,
      pages_viewed = array_append(
        array_remove(pages_viewed, p_current_page),
        p_current_page
      ),
      heartbeat_at = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
    WHERE id = p_session_id AND user_id = v_user_id;
  END IF;
  
  -- Logar evento
  INSERT INTO public.book_access_logs (
    user_id, book_id, page_number, event_type, session_id
  ) VALUES (
    v_user_id, p_book_id, p_current_page, 'page_view', p_session_id::text
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'currentPage', p_current_page,
    'progressPercent', v_progress_percent,
    'isCompleted', v_is_completed,
    'totalPages', v_total_pages
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;