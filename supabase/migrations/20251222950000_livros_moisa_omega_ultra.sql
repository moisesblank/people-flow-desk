-- ============================================
-- 🌌🔥 LIVROS DO MOISA — OMEGA ULTRA 🔥🌌
-- SISTEMA COMPLETO DE LIVRO WEB NÍVEL NASA
-- ANO 2300 — ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
-- ============================================
--
-- 📍 MAPA DE URLs DEFINITIVO:
--   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
--   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos + /alunos/livro-web
--   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
--   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
--
-- ============================================

-- ============================================
-- 1) TIPOS ENUM PARA LIVROS
-- ============================================
DO $$ BEGIN
  CREATE TYPE web_book_status AS ENUM (
    'draft',
    'uploading',
    'queued',
    'processing',
    'transmuting',
    'generating_cover',
    'ready',
    'error',
    'archived'
  );
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
    'apostilas',
    'livros_didaticos',
    'material_complementar',
    'outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE annotation_type AS ENUM (
    'highlight',
    'underline',
    'strikethrough',
    'note',
    'bookmark',
    'drawing',
    'circle',
    'arrow',
    'rectangle',
    'text_box',
    'voice_note'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE book_access_event AS ENUM (
    'book_list_view',
    'book_opened',
    'page_view',
    'page_zoom',
    'page_rotate',
    'annotation_created',
    'annotation_updated',
    'annotation_deleted',
    'chat_message_sent',
    'download_attempt',
    'print_attempt',
    'copy_attempt',
    'screenshot_attempt',
    'devtools_detected',
    'violation_detected'
  );
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
  
  -- Metadados
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  author TEXT DEFAULT 'Prof. Moisés Medeiros',
  isbn TEXT,
  edition TEXT,
  publisher TEXT DEFAULT 'Moisés Medeiros Educação',
  year_published INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  category web_book_category NOT NULL DEFAULT 'outros',
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Status
  status web_book_status NOT NULL DEFAULT 'draft',
  status_message TEXT,
  
  -- Armazenamento Original
  original_bucket TEXT NOT NULL DEFAULT 'ena-assets-raw',
  original_path TEXT NOT NULL,
  original_filename TEXT,
  original_size_bytes BIGINT DEFAULT 0,
  original_mime_type TEXT DEFAULT 'application/pdf',
  original_checksum TEXT,
  
  -- Transmutação
  transmuted_bucket TEXT DEFAULT 'ena-assets-transmuted',
  total_pages INTEGER DEFAULT 0,
  page_format TEXT DEFAULT 'webp',
  page_quality INTEGER DEFAULT 90,
  
  -- Sumário Gerado por IA
  summary JSONB DEFAULT '[]'::jsonb,
  table_of_contents JSONB DEFAULT '[]'::jsonb,
  content_structure JSONB DEFAULT '{}'::jsonb,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Capa
  cover_path TEXT,
  cover_url TEXT,
  cover_generated_by_ai BOOLEAN DEFAULT false,
  thumbnail_path TEXT,
  
  -- Acesso
  is_premium BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  required_roles TEXT[] NOT NULL DEFAULT ARRAY['beta', 'owner', 'admin'],
  course_id UUID,
  lesson_id UUID,
  
  -- Proteção
  watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  drm_level TEXT DEFAULT 'high',
  allow_annotations BOOLEAN NOT NULL DEFAULT true,
  allow_chat BOOLEAN NOT NULL DEFAULT true,
  max_concurrent_sessions INTEGER DEFAULT 3,
  
  -- Métricas
  view_count INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  avg_reading_time_seconds INTEGER DEFAULT 0,
  total_annotations INTEGER DEFAULT 0,
  avg_completion_percent NUMERIC(5,2) DEFAULT 0,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Processamento
  job_id UUID,
  processed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- SEO
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_web_books_status ON public.web_books(status);
CREATE INDEX IF NOT EXISTS idx_web_books_category ON public.web_books(category);
CREATE INDEX IF NOT EXISTS idx_web_books_premium ON public.web_books(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_web_books_ready ON public.web_books(status) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_web_books_published ON public.web_books(is_published, status) WHERE is_published = true AND status = 'ready';
CREATE INDEX IF NOT EXISTS idx_web_books_created_by ON public.web_books(created_by);
CREATE INDEX IF NOT EXISTS idx_web_books_course ON public.web_books(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_books_slug ON public.web_books(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_books_search ON public.web_books USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_web_books_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_web_books_updated ON public.web_books;
CREATE TRIGGER trg_web_books_updated
  BEFORE UPDATE ON public.web_books
  FOR EACH ROW
  EXECUTE FUNCTION update_web_books_timestamp();

-- ============================================
-- 3) TABELA: web_book_pages (Páginas do Livro)
-- ============================================
CREATE TABLE IF NOT EXISTS public.web_book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Página
  page_number INTEGER NOT NULL,
  
  -- Conteúdo
  content_json JSONB DEFAULT '{}'::jsonb,
  text_content TEXT,
  text_content_searchable TSVECTOR,
  ocr_text TEXT,
  
  -- Imagem Transmutada
  image_path TEXT NOT NULL,
  image_format TEXT NOT NULL DEFAULT 'webp',
  image_quality INTEGER DEFAULT 90,
  thumbnail_path TEXT,
  
  -- Dimensões
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  aspect_ratio NUMERIC(6,4),
  
  -- Proteção
  has_burned_watermark BOOLEAN NOT NULL DEFAULT false,
  watermark_hash TEXT,
  encryption_key_hash TEXT,
  
  -- Navegação
  chapter_title TEXT,
  chapter_number INTEGER,
  section_title TEXT,
  anchor_id TEXT,
  
  -- IA
  ai_summary TEXT,
  ai_keywords TEXT[],
  ai_concepts JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(book_id, page_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_web_book_pages_book ON public.web_book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_web_book_pages_order ON public.web_book_pages(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_web_book_pages_chapter ON public.web_book_pages(book_id, chapter_number) WHERE chapter_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_web_book_pages_search ON public.web_book_pages USING gin(text_content_searchable);

-- Trigger para tsvector
CREATE OR REPLACE FUNCTION update_page_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.text_content_searchable := to_tsvector('portuguese', coalesce(NEW.text_content, '') || ' ' || coalesce(NEW.chapter_title, '') || ' ' || coalesce(NEW.section_title, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_page_search ON public.web_book_pages;
CREATE TRIGGER trg_page_search
  BEFORE INSERT OR UPDATE ON public.web_book_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_page_search_vector();

-- ============================================
-- 4) TABELA: user_book_progress (Progresso do Aluno)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_book_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Progresso
  current_page INTEGER NOT NULL DEFAULT 1,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_reading_time_seconds INTEGER DEFAULT 0,
  pages_read INTEGER[] DEFAULT '{}',
  pages_visited INTEGER DEFAULT 0,
  
  -- Sessões
  session_count INTEGER DEFAULT 1,
  last_session_id UUID,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  
  -- Percentual
  progress_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Status
  is_started BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Configurações do usuário
  zoom_level INTEGER DEFAULT 100,
  display_mode TEXT DEFAULT 'single',
  theme_preference TEXT DEFAULT 'auto',
  
  -- Métricas
  annotations_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  
  UNIQUE(user_id, book_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_book_progress_user ON public.user_book_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_progress_book ON public.user_book_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_progress_recent ON public.user_book_progress(user_id, last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_book_progress_completed ON public.user_book_progress(user_id, is_completed) WHERE is_completed = true;

-- ============================================
-- 5) TABELA: user_annotations (Anotações do Aluno)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.web_book_pages(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Tipo
  annotation_type annotation_type NOT NULL DEFAULT 'note',
  
  -- Conteúdo
  content TEXT,
  rich_content JSONB,
  drawing_data BYTEA,
  drawing_data_compressed BYTEA,
  voice_note_url TEXT,
  voice_note_duration_seconds INTEGER,
  
  -- Posição
  position_x NUMERIC(10,4),
  position_y NUMERIC(10,4),
  width NUMERIC(10,4),
  height NUMERIC(10,4),
  rotation NUMERIC(6,2) DEFAULT 0,
  
  -- Seleção de texto
  text_selection_start INTEGER,
  text_selection_end INTEGER,
  selected_text TEXT,
  
  -- Estilo
  color TEXT DEFAULT '#FFD700',
  background_color TEXT,
  stroke_width NUMERIC(5,2) DEFAULT 2,
  font_size INTEGER DEFAULT 14,
  opacity NUMERIC(3,2) DEFAULT 1,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Organização
  folder_id UUID,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT true,
  
  -- Sync
  is_synced BOOLEAN DEFAULT false,
  sync_version INTEGER DEFAULT 1,
  local_id TEXT,
  
  -- Colaboração (futuro)
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT '{}'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_annotations_user ON public.user_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_book ON public.user_annotations(book_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_page ON public.user_annotations(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_user_annotations_user_book ON public.user_annotations(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_type ON public.user_annotations(annotation_type);
CREATE INDEX IF NOT EXISTS idx_user_annotations_favorites ON public.user_annotations(user_id, is_favorite) WHERE is_favorite = true;

-- ============================================
-- 6) TABELA: user_bookmarks (Marcadores)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Dados
  title TEXT,
  note TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Organização
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(user_id, book_id, page_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_book ON public.user_bookmarks(user_id, book_id);

-- ============================================
-- 7) TABELA: book_chat_threads (Threads de Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Título
  title TEXT,
  
  -- Contexto
  initial_page INTEGER,
  initial_chapter TEXT,
  initial_topic TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  
  -- IA
  ai_model_used TEXT DEFAULT 'gpt-4o-mini',
  total_tokens_used INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_book_chat_threads_user ON public.book_chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_threads_book ON public.book_chat_threads(book_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_threads_active ON public.book_chat_threads(user_id, is_active, updated_at DESC);

-- ============================================
-- 8) TABELA: book_chat_messages (Mensagens do Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.book_chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contexto
  page_number INTEGER,
  chapter_title TEXT,
  topic TEXT,
  content_reference JSONB,
  
  -- Mensagem
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- IA
  model_used TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  response_time_ms INTEGER,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Feedback
  is_helpful BOOLEAN,
  feedback_text TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_book_chat_messages_thread ON public.book_chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_book_chat_messages_user ON public.book_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_messages_book ON public.book_chat_messages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_messages_context ON public.book_chat_messages(book_id, page_number);

-- Trigger para atualizar thread
CREATE OR REPLACE FUNCTION update_chat_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.book_chat_threads 
  SET 
    message_count = message_count + 1,
    updated_at = now(),
    total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_input, 0) + COALESCE(NEW.tokens_output, 0)
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_thread_on_message ON public.book_chat_messages;
CREATE TRIGGER trg_update_thread_on_message
  AFTER INSERT ON public.book_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_thread_on_message();

-- ============================================
-- 9) TABELA: book_access_logs (Log Forense)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_cpf TEXT,
  user_name TEXT,
  user_role TEXT,
  
  -- Livro
  book_id UUID REFERENCES public.web_books(id) ON DELETE SET NULL,
  book_title TEXT,
  page_number INTEGER,
  
  -- Evento
  event_type book_access_event NOT NULL,
  event_description TEXT,
  
  -- Contexto
  session_id TEXT,
  reading_session_id UUID,
  
  -- Segurança
  ip_hash TEXT,
  ua_hash TEXT,
  device_fingerprint TEXT,
  
  -- Violação
  is_violation BOOLEAN DEFAULT false,
  violation_type TEXT,
  threat_score INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Localização
  country_code TEXT,
  region TEXT,
  city TEXT
);

-- Índices (particionamento por tempo seria ideal para produção)
CREATE INDEX IF NOT EXISTS idx_book_access_logs_user ON public.book_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_book_access_logs_book ON public.book_access_logs(book_id);
CREATE INDEX IF NOT EXISTS idx_book_access_logs_time ON public.book_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_access_logs_violations ON public.book_access_logs(user_id, created_at DESC) WHERE is_violation = true;
CREATE INDEX IF NOT EXISTS idx_book_access_logs_event ON public.book_access_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_access_logs_session ON public.book_access_logs(session_id) WHERE session_id IS NOT NULL;

-- ============================================
-- 10) TABELA: book_reading_sessions (Sessões de Leitura)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Sessão
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Páginas
  start_page INTEGER NOT NULL DEFAULT 1,
  end_page INTEGER,
  pages_viewed INTEGER[] DEFAULT '{}',
  
  -- Atividade
  annotations_created INTEGER DEFAULT 0,
  chat_messages_sent INTEGER DEFAULT 0,
  zoom_changes INTEGER DEFAULT 0,
  
  -- Dispositivo
  device_type TEXT,
  device_fingerprint TEXT,
  ip_hash TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  heartbeat_at TIMESTAMPTZ DEFAULT now(),
  
  -- Segurança
  violations_count INTEGER DEFAULT 0,
  was_revoked BOOLEAN DEFAULT false,
  revoke_reason TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON public.book_reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON public.book_reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_active ON public.book_reading_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reading_sessions_heartbeat ON public.book_reading_sessions(heartbeat_at) WHERE is_active = true;

-- ============================================
-- 11) TABELA: book_ratings (Avaliações)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Status
  is_public BOOLEAN DEFAULT true,
  is_verified_reader BOOLEAN DEFAULT false,
  
  UNIQUE(user_id, book_id)
);

-- Índice e trigger para atualizar média
CREATE INDEX IF NOT EXISTS idx_book_ratings_book ON public.book_ratings(book_id);

CREATE OR REPLACE FUNCTION update_book_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.web_books
  SET 
    rating_average = (SELECT AVG(rating)::NUMERIC(3,2) FROM public.book_ratings WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    rating_count = (SELECT COUNT(*) FROM public.book_ratings WHERE book_id = COALESCE(NEW.book_id, OLD.book_id))
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_book_ratings ON public.book_ratings;
CREATE TRIGGER trg_update_book_ratings
  AFTER INSERT OR UPDATE OR DELETE ON public.book_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_book_rating_stats();

-- ============================================
-- 12) TABELA: book_import_jobs (Fila de Importação)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Livro
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5,
  
  -- Processamento
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Progresso
  current_step TEXT,
  current_page INTEGER,
  total_pages INTEGER,
  progress_percent INTEGER DEFAULT 0,
  
  -- Resultado
  output_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_code TEXT,
  error_stack TEXT,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Worker
  locked_by TEXT,
  locked_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_book_import_jobs_status ON public.book_import_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_book_import_jobs_book ON public.book_import_jobs(book_id);
CREATE INDEX IF NOT EXISTS idx_book_import_jobs_pending ON public.book_import_jobs(status, next_retry_at) WHERE status IN ('pending', 'failed');

-- ============================================
-- 13) FUNÇÕES AUXILIARES
-- ============================================

-- Verificar se é owner
CREATE OR REPLACE FUNCTION public.fn_is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    LOWER(auth.email()) = 'moisesblank@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar se é beta ou owner
CREATE OR REPLACE FUNCTION public.fn_is_beta_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.fn_is_owner()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('beta', 'admin', 'funcionario')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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
  v_toc JSONB;
  v_session_id UUID;
  v_watermark_seed TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'errorCode', 'UNAUTHORIZED');
  END IF;
  
  -- Buscar dados do usuário
  SELECT u.email, p.cpf, p.name, p.role 
  INTO v_user_email, v_user_cpf, v_user_name, v_user_role
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
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
  
  -- Verificar bloqueio SANCTUM
  IF EXISTS (
    SELECT 1 FROM public.sanctum_risk_state
    WHERE user_id = v_user_id AND locked_until > now()
  ) AND NOT v_is_owner THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta bloqueada', 'errorCode', 'LOCKED');
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
  
  -- Criar progresso se não existe
  INSERT INTO public.user_book_progress (user_id, book_id, current_page, last_read_at)
  VALUES (v_user_id, p_book_id, 1, now())
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 17) FUNÇÃO: fn_list_books_for_category()
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
  v_is_owner := public.fn_is_owner();
  
  -- Contar total
  SELECT COUNT(*) INTO v_total
  FROM public.web_books b
  WHERE (b.status = 'ready' OR v_is_owner)
    AND (b.is_published = true OR v_is_owner)
    AND (p_category IS NULL OR b.category::text = p_category)
    AND (p_search IS NULL OR 
         b.title ILIKE '%' || p_search || '%' OR
         b.description ILIKE '%' || p_search || '%');
  
  -- Buscar livros
  SELECT jsonb_agg(book_data ORDER BY created_at DESC) INTO v_books
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'title', b.title,
      'subtitle', b.subtitle,
      'author', b.author,
      'category', b.category,
      'totalPages', b.total_pages,
      'coverUrl', b.cover_url,
      'ratingAverage', b.rating_average,
      'ratingCount', b.rating_count,
      'viewCount', b.view_count,
      'createdAt', b.created_at,
      'status', b.status,
      'progress', (
        SELECT jsonb_build_object(
          'currentPage', COALESCE(p.current_page, 0),
          'progressPercent', COALESCE(p.progress_percent, 0),
          'isCompleted', COALESCE(p.is_completed, false),
          'lastReadAt', p.last_read_at
        )
        FROM public.user_book_progress p
        WHERE p.user_id = v_user_id AND p.book_id = b.id
      )
    ) as book_data,
    b.created_at
    FROM public.web_books b
    WHERE (b.status = 'ready' OR v_is_owner)
      AND (b.is_published = true OR v_is_owner)
      AND (p_category IS NULL OR b.category::text = p_category)
      AND (p_search IS NULL OR 
           b.title ILIKE '%' || p_search || '%' OR
           b.description ILIKE '%' || p_search || '%')
    ORDER BY b.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;
  
  RETURN jsonb_build_object(
    'success', true,
    'books', COALESCE(v_books, '[]'::jsonb),
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'hasMore', (p_offset + p_limit) < v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 18) FUNÇÃO: fn_get_book_annotations()
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_book_annotations(
  p_book_id UUID,
  p_page_number INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_annotations JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;
  
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
      'selectedText', a.selected_text,
      'isFavorite', a.is_favorite,
      'createdAt', a.created_at,
      'updatedAt', a.updated_at
    ) ORDER BY a.created_at DESC
  ) INTO v_annotations
  FROM public.user_annotations a
  WHERE a.user_id = v_user_id 
    AND a.book_id = p_book_id
    AND (p_page_number IS NULL OR a.page_number = p_page_number);
  
  RETURN jsonb_build_object(
    'success', true,
    'annotations', COALESCE(v_annotations, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 19) FUNÇÃO: fn_get_book_stats() (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_book_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  IF NOT public.fn_is_owner() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;
  
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
    'booksByCategory', (
      SELECT jsonb_object_agg(category, cnt)
      FROM (
        SELECT category::text, COUNT(*) as cnt
        FROM public.web_books
        GROUP BY category
      ) sub
    ),
    'recentViolations', (
      SELECT COUNT(*) FROM public.book_access_logs
      WHERE is_violation = true AND created_at > now() - interval '24 hours'
    )
  ) INTO v_stats;
  
  RETURN jsonb_build_object('success', true, 'stats', v_stats);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 20) RLS POLICIES
-- ============================================
ALTER TABLE public.web_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_import_jobs ENABLE ROW LEVEL SECURITY;

-- web_books
DROP POLICY IF EXISTS "web_books_owner_all" ON public.web_books;
CREATE POLICY "web_books_owner_all" ON public.web_books
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

DROP POLICY IF EXISTS "web_books_beta_read" ON public.web_books;
CREATE POLICY "web_books_beta_read" ON public.web_books
  FOR SELECT TO authenticated
  USING (status = 'ready' AND is_published = true AND public.fn_is_beta_or_owner());

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
      WHERE b.id = book_id AND b.status = 'ready' AND b.is_published = true
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

-- user_bookmarks
DROP POLICY IF EXISTS "user_bookmarks_own" ON public.user_bookmarks;
CREATE POLICY "user_bookmarks_own" ON public.user_bookmarks
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- book_chat_threads
DROP POLICY IF EXISTS "book_chat_threads_own" ON public.book_chat_threads;
CREATE POLICY "book_chat_threads_own" ON public.book_chat_threads
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- book_chat_messages
DROP POLICY IF EXISTS "book_chat_messages_own" ON public.book_chat_messages;
CREATE POLICY "book_chat_messages_own" ON public.book_chat_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- book_access_logs (admin only)
DROP POLICY IF EXISTS "book_access_logs_admin" ON public.book_access_logs;
CREATE POLICY "book_access_logs_admin" ON public.book_access_logs
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

-- book_reading_sessions
DROP POLICY IF EXISTS "book_reading_sessions_own" ON public.book_reading_sessions;
CREATE POLICY "book_reading_sessions_own" ON public.book_reading_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

-- book_ratings
DROP POLICY IF EXISTS "book_ratings_own" ON public.book_ratings;
CREATE POLICY "book_ratings_own" ON public.book_ratings
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_owner());

DROP POLICY IF EXISTS "book_ratings_public_read" ON public.book_ratings;
CREATE POLICY "book_ratings_public_read" ON public.book_ratings
  FOR SELECT TO authenticated
  USING (is_public = true);

-- book_import_jobs (admin only)
DROP POLICY IF EXISTS "book_import_jobs_admin" ON public.book_import_jobs;
CREATE POLICY "book_import_jobs_admin" ON public.book_import_jobs
  FOR ALL TO authenticated
  USING (public.fn_is_owner());

-- ============================================
-- 21) GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.fn_is_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_beta_or_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_for_reader TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_save_book_annotation TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_reading_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_annotations TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_book_stats TO authenticated;

GRANT SELECT ON public.web_books TO authenticated;
GRANT SELECT ON public.web_book_pages TO authenticated;
GRANT ALL ON public.user_book_progress TO authenticated;
GRANT ALL ON public.user_annotations TO authenticated;
GRANT ALL ON public.user_bookmarks TO authenticated;
GRANT ALL ON public.book_chat_threads TO authenticated;
GRANT ALL ON public.book_chat_messages TO authenticated;
GRANT ALL ON public.book_reading_sessions TO authenticated;
GRANT ALL ON public.book_ratings TO authenticated;

-- ============================================
-- ✅ LIVROS DO MOISA — SQL OMEGA ULTRA COMPLETO!
-- ============================================
