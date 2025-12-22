-- ============================================
-- 🌌🔥 LIVROS DO MOISA — SISTEMA COMPLETO DE LIVRO WEB 🔥🌌
-- ANO 2300 — PROTEÇÃO NÍVEL NASA + LEITURA INTERATIVA
-- MESTRE MOISÉS MEDEIROS
-- ============================================

-- ============================================
-- 1) TIPOS ENUM PARA LIVROS
-- ============================================
DO $$ BEGIN
  CREATE TYPE web_book_status AS ENUM ('draft', 'queued', 'processing', 'ready', 'error', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE web_book_category AS ENUM (
    'quimica_geral',
    'quimica_organica',
    'fisico_quimica',
    'revisao_ciclica',
    'previsao_final',
    'exercicios',
    'simulados',
    'resumos',
    'mapas_mentais',
    'outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE annotation_type AS ENUM ('highlight', 'drawing', 'note', 'bookmark', 'circle', 'underline', 'arrow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2) TABELA: web_books (Livros Web)
-- ============================================
CREATE TABLE IF NOT EXISTS public.web_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  author TEXT DEFAULT 'Prof. Moisés Medeiros',
  category web_book_category NOT NULL DEFAULT 'outros',
  tags TEXT[] DEFAULT '{}',
  
  status web_book_status NOT NULL DEFAULT 'draft',
  
  original_bucket TEXT NOT NULL DEFAULT 'ena-assets-raw',
  original_path TEXT NOT NULL,
  original_filename TEXT,
  original_size_bytes BIGINT DEFAULT 0,
  
  transmuted_bucket TEXT DEFAULT 'ena-assets-transmuted',
  total_pages INTEGER DEFAULT 0,
  
  summary JSONB DEFAULT '[]'::jsonb,
  content_structure JSONB DEFAULT '{}'::jsonb,
  
  cover_path TEXT,
  cover_url TEXT,
  
  is_premium BOOLEAN NOT NULL DEFAULT true,
  required_roles TEXT[] NOT NULL DEFAULT ARRAY['beta', 'owner', 'admin'],
  course_id UUID,
  
  watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  drm_level TEXT DEFAULT 'high',
  
  view_count INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  avg_reading_time_seconds INTEGER DEFAULT 0,
  
  job_id UUID,
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_web_books_status ON public.web_books(status);
CREATE INDEX IF NOT EXISTS idx_web_books_category ON public.web_books(category);
CREATE INDEX IF NOT EXISTS idx_web_books_premium ON public.web_books(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_web_books_ready ON public.web_books(status) WHERE status = 'ready';

-- ============================================
-- 3) TABELA: web_book_pages (Páginas do Livro)
-- ============================================
CREATE TABLE IF NOT EXISTS public.web_book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  page_number INTEGER NOT NULL,
  
  content_json JSONB DEFAULT '{}'::jsonb,
  text_content TEXT,
  
  image_path TEXT NOT NULL,
  image_format TEXT NOT NULL DEFAULT 'webp',
  thumbnail_path TEXT,
  
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  
  has_burned_watermark BOOLEAN NOT NULL DEFAULT false,
  watermark_hash TEXT,
  
  chapter_title TEXT,
  section_title TEXT,
  anchor_id TEXT,
  
  UNIQUE(book_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_web_book_pages_book ON public.web_book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_web_book_pages_order ON public.web_book_pages(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_web_book_pages_chapter ON public.web_book_pages(book_id, chapter_title) WHERE chapter_title IS NOT NULL;

-- ============================================
-- 4) TABELA: user_book_progress (Progresso do Aluno)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_book_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  current_page INTEGER NOT NULL DEFAULT 1,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_reading_time_seconds INTEGER DEFAULT 0,
  pages_read INTEGER[] DEFAULT '{}',
  
  progress_percent NUMERIC(5,2) DEFAULT 0,
  
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_user_book_progress_user ON public.user_book_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_progress_book ON public.user_book_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_progress_recent ON public.user_book_progress(user_id, last_read_at DESC);

-- ============================================
-- 5) TABELA: user_annotations (Anotações do Aluno)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.web_book_pages(id) ON DELETE SET NULL,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  annotation_type annotation_type NOT NULL DEFAULT 'highlight',
  content TEXT,
  drawing_data BYTEA,
  
  position_x NUMERIC,
  position_y NUMERIC,
  width NUMERIC,
  height NUMERIC,
  
  color TEXT DEFAULT '#FFD700',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_annotations_user ON public.user_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_book ON public.user_annotations(book_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_page ON public.user_annotations(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_user_annotations_active ON public.user_annotations(user_id, book_id) WHERE is_deleted = false;

-- ============================================
-- 6) TABELA: book_chat_messages (Chat IA do Livro)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  context_text TEXT,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_book_chat_user ON public.book_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_book ON public.book_chat_messages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_conversation ON public.book_chat_messages(user_id, book_id, created_at DESC);

-- ============================================
-- 7) TABELA: book_access_logs (Log de Acesso Forense)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_cpf TEXT,
  
  book_id UUID REFERENCES public.web_books(id) ON DELETE SET NULL,
  page_number INTEGER,
  
  event_type TEXT NOT NULL,
  
  session_id TEXT,
  ip_hash TEXT,
  ua_hash TEXT,
  device_fingerprint TEXT,
  
  is_violation BOOLEAN DEFAULT false,
  violation_type TEXT,
  threat_score INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_book_access_user ON public.book_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_book_access_book ON public.book_access_logs(book_id);
CREATE INDEX IF NOT EXISTS idx_book_access_time ON public.book_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_access_violations ON public.book_access_logs(user_id, created_at DESC) WHERE is_violation = true;

-- ============================================
-- 8) FUNÇÃO: fn_is_owner()
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 9) FUNÇÃO: fn_is_beta_or_owner()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 10) FUNÇÃO: fn_get_book_for_reader()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11) FUNÇÃO: fn_save_annotation()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12) FUNÇÃO: fn_update_reading_progress()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 13) FUNÇÃO: fn_list_books_for_category()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14) FUNÇÃO: fn_get_user_annotations()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 15) FUNÇÃO: fn_delete_annotation()
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 16) TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_update_web_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_web_books_updated_at ON public.web_books;
CREATE TRIGGER trg_web_books_updated_at
  BEFORE UPDATE ON public.web_books
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_web_books_updated_at();

DROP TRIGGER IF EXISTS trg_user_book_progress_updated_at ON public.user_book_progress;
CREATE TRIGGER trg_user_book_progress_updated_at
  BEFORE UPDATE ON public.user_book_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_web_books_updated_at();

DROP TRIGGER IF EXISTS trg_user_annotations_updated_at ON public.user_annotations;
CREATE TRIGGER trg_user_annotations_updated_at
  BEFORE UPDATE ON public.user_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_web_books_updated_at();

-- ============================================
-- 17) RLS POLICIES
-- ============================================
ALTER TABLE public.web_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "web_books_owner_all" ON public.web_books;
CREATE POLICY "web_books_owner_all" ON public.web_books
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

DROP POLICY IF EXISTS "web_books_beta_read" ON public.web_books;
CREATE POLICY "web_books_beta_read" ON public.web_books
  FOR SELECT TO authenticated
  USING (status = 'ready' AND public.fn_is_beta_or_owner());

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

DROP POLICY IF EXISTS "user_book_progress_own" ON public.user_book_progress;
CREATE POLICY "user_book_progress_own" ON public.user_book_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

DROP POLICY IF EXISTS "user_annotations_own" ON public.user_annotations;
CREATE POLICY "user_annotations_own" ON public.user_annotations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

DROP POLICY IF EXISTS "book_chat_own" ON public.book_chat_messages;
CREATE POLICY "book_chat_own" ON public.book_chat_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

DROP POLICY IF EXISTS "book_access_logs_admin" ON public.book_access_logs;
CREATE POLICY "book_access_logs_admin" ON public.book_access_logs
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

-- ============================================
-- 18) GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION public.fn_is_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_beta_or_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_for_reader TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_save_annotation TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_reading_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_user_annotations TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_delete_annotation TO authenticated;

GRANT SELECT ON public.web_books TO authenticated;
GRANT SELECT ON public.web_book_pages TO authenticated;
GRANT ALL ON public.user_book_progress TO authenticated;
GRANT ALL ON public.user_annotations TO authenticated;
GRANT ALL ON public.book_chat_messages TO authenticated;