-- ============================================
-- 🌌 LIVROS DO MOISA — PARTE 2: CHAT, SESSÕES, RATINGS, JOBS
-- ============================================

-- ============================================
-- 7) TABELA: book_chat_threads (Threads de Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  title TEXT,
  initial_page INTEGER,
  initial_chapter TEXT,
  initial_topic TEXT,
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  ai_model_used TEXT DEFAULT 'gpt-4o-mini',
  total_tokens_used INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_book_chat_threads_user ON public.book_chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_threads_book ON public.book_chat_threads(book_id);
CREATE INDEX IF NOT EXISTS idx_book_chat_threads_active ON public.book_chat_threads(user_id, is_active, updated_at DESC);

ALTER TABLE public.book_chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_chat_threads_own" ON public.book_chat_threads;
CREATE POLICY "book_chat_threads_own" ON public.book_chat_threads
  FOR ALL USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

-- ============================================
-- 8) Adicionar colunas faltantes em book_chat_messages
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.book_chat_threads(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS content_html TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS tokens_input INTEGER;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS tokens_output INTEGER;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS is_helpful BOOLEAN;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS feedback_text TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_book_chat_messages_thread ON public.book_chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_book_chat_messages_context ON public.book_chat_messages(book_id, page_number);

-- Trigger para atualizar thread
CREATE OR REPLACE FUNCTION update_chat_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.book_chat_threads 
    SET 
      message_count = message_count + 1,
      updated_at = now(),
      total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_input, 0) + COALESCE(NEW.tokens_output, 0)
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_thread_on_message ON public.book_chat_messages;
CREATE TRIGGER trg_update_thread_on_message
  AFTER INSERT ON public.book_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_thread_on_message();

-- ============================================
-- 9) Adicionar colunas faltantes em book_access_logs
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS book_title TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS event_description TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS reading_session_id UUID;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS country_code TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS region TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.book_access_logs ADD COLUMN IF NOT EXISTS city TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_book_access_logs_session ON public.book_access_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_access_logs_event ON public.book_access_logs(event_type, created_at DESC);

-- ============================================
-- 10) TABELA: book_reading_sessions (Sessões de Leitura)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  start_page INTEGER NOT NULL DEFAULT 1,
  end_page INTEGER,
  pages_viewed INTEGER[] DEFAULT '{}',
  
  annotations_created INTEGER DEFAULT 0,
  chat_messages_sent INTEGER DEFAULT 0,
  zoom_changes INTEGER DEFAULT 0,
  
  device_type TEXT,
  device_fingerprint TEXT,
  ip_hash TEXT,
  
  is_active BOOLEAN DEFAULT true,
  heartbeat_at TIMESTAMPTZ DEFAULT now(),
  
  violations_count INTEGER DEFAULT 0,
  was_revoked BOOLEAN DEFAULT false,
  revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON public.book_reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON public.book_reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_active ON public.book_reading_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reading_sessions_heartbeat ON public.book_reading_sessions(heartbeat_at) WHERE is_active = true;

ALTER TABLE public.book_reading_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_reading_sessions_own" ON public.book_reading_sessions;
CREATE POLICY "book_reading_sessions_own" ON public.book_reading_sessions
  FOR ALL USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

-- ============================================
-- 11) TABELA: book_ratings (Avaliações)
-- ============================================
CREATE TABLE IF NOT EXISTS public.book_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  is_public BOOLEAN DEFAULT true,
  is_verified_reader BOOLEAN DEFAULT false,
  
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_book_ratings_book ON public.book_ratings(book_id);

ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_ratings_select" ON public.book_ratings;
CREATE POLICY "book_ratings_select" ON public.book_ratings
  FOR SELECT USING (is_public = true OR auth.uid() = user_id OR public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "book_ratings_insert" ON public.book_ratings;
CREATE POLICY "book_ratings_insert" ON public.book_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "book_ratings_update" ON public.book_ratings;
CREATE POLICY "book_ratings_update" ON public.book_ratings
  FOR UPDATE USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "book_ratings_delete" ON public.book_ratings;
CREATE POLICY "book_ratings_delete" ON public.book_ratings
  FOR DELETE USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

-- Trigger para atualizar média do livro
CREATE OR REPLACE FUNCTION update_book_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.web_books
  SET 
    rating_average = (SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0) FROM public.book_ratings WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    rating_count = (SELECT COUNT(*) FROM public.book_ratings WHERE book_id = COALESCE(NEW.book_id, OLD.book_id))
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  current_step TEXT,
  current_page INTEGER,
  total_pages INTEGER,
  progress_percent INTEGER DEFAULT 0,
  
  output_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_code TEXT,
  error_stack TEXT,
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  locked_by TEXT,
  locked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_book_import_jobs_status ON public.book_import_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_book_import_jobs_book ON public.book_import_jobs(book_id);
CREATE INDEX IF NOT EXISTS idx_book_import_jobs_pending ON public.book_import_jobs(status, next_retry_at) WHERE status IN ('pending', 'failed');

ALTER TABLE public.book_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_import_jobs_owner" ON public.book_import_jobs;
CREATE POLICY "book_import_jobs_owner" ON public.book_import_jobs
  FOR ALL USING (public.is_owner(auth.uid()));

-- ============================================
-- 13) FUNÇÕES AUXILIARES SEGURAS
-- ============================================

-- Verificar se é owner (versão segura para livros)
CREATE OR REPLACE FUNCTION public.fn_is_book_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'moisesblank@gmail.com'
    OR public.is_owner(auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Verificar se pode acessar livros (beta, admin, owner)
CREATE OR REPLACE FUNCTION public.fn_can_access_books()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.fn_is_book_owner()
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('beta', 'admin', 'owner', 'funcionario')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Função para obter watermark do usuário
CREATE OR REPLACE FUNCTION public.fn_get_book_watermark()
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT nome, email, cpf INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN jsonb_build_object(
    'name', COALESCE(v_profile.nome, 'Usuário'),
    'email', COALESCE(v_profile.email, auth.jwt() ->> 'email'),
    'cpf', COALESCE(v_profile.cpf, '***'),
    'timestamp', now(),
    'is_owner', public.fn_is_book_owner()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Função para registrar acesso ao livro
CREATE OR REPLACE FUNCTION public.fn_log_book_access(
  p_book_id UUID,
  p_event_type TEXT,
  p_page_number INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_is_violation BOOLEAN DEFAULT false,
  p_threat_score INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_profile RECORD;
BEGIN
  SELECT nome, email, cpf INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();
  
  INSERT INTO public.book_access_logs (
    user_id, user_email, user_cpf, user_name,
    book_id, page_number, event_type,
    is_violation, threat_score, metadata
  ) VALUES (
    auth.uid(),
    COALESCE(v_profile.email, auth.jwt() ->> 'email'),
    v_profile.cpf,
    v_profile.nome,
    p_book_id,
    p_page_number,
    p_event_type::book_access_event,
    p_is_violation,
    p_threat_score,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;