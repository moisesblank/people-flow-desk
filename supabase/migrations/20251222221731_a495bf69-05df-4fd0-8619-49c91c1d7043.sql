-- ============================================
-- LIVROS DO MOISA — ADAPTAÇÃO PARTE 1 (FINAL)
-- ============================================

-- 1) CRIAR ENUMs NOVOS
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
  ALTER TYPE annotation_type ADD VALUE IF NOT EXISTS 'circle';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE annotation_type ADD VALUE IF NOT EXISTS 'arrow';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

-- 2) ADICIONAR COLUNAS À TABELA web_books
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS original_bucket TEXT DEFAULT 'ena-assets-raw';
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS original_path TEXT;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS original_size_bytes BIGINT DEFAULT 0;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS transmuted_bucket TEXT DEFAULT 'ena-assets-transmuted';
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS content_structure JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS cover_path TEXT;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT true;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS required_roles TEXT[] DEFAULT ARRAY['beta', 'owner', 'admin'];
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS drm_level TEXT DEFAULT 'high';
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS avg_reading_time_seconds INTEGER DEFAULT 0;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS job_id UUID;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE public.web_books ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3) NOVOS ÍNDICES
CREATE INDEX IF NOT EXISTS idx_web_books_premium ON public.web_books(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_web_books_ready ON public.web_books(status) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_web_books_created_by ON public.web_books(created_by);
CREATE INDEX IF NOT EXISTS idx_web_books_course ON public.web_books(course_id) WHERE course_id IS NOT NULL;