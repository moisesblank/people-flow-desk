-- ============================================
-- LIVROS DO MOISA — ADAPTAÇÃO PARTE 2
-- ============================================

-- 1) ATUALIZAR web_book_pages - adicionar novas colunas
ALTER TABLE public.web_book_pages ADD COLUMN IF NOT EXISTS content_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.web_book_pages ADD COLUMN IF NOT EXISTS image_format TEXT DEFAULT 'webp';
ALTER TABLE public.web_book_pages ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE public.web_book_pages ADD COLUMN IF NOT EXISTS has_burned_watermark BOOLEAN DEFAULT false;
ALTER TABLE public.web_book_pages ADD COLUMN IF NOT EXISTS watermark_hash TEXT;
ALTER TABLE public.web_book_pages ADD COLUMN IF NOT EXISTS anchor_id TEXT;

-- Novo índice para capítulos
CREATE INDEX IF NOT EXISTS idx_web_book_pages_chapter ON public.web_book_pages(book_id, chapter_title) WHERE chapter_title IS NOT NULL;

-- 2) ATUALIZAR user_book_progress - novo índice
CREATE INDEX IF NOT EXISTS idx_user_book_progress_recent ON public.user_book_progress(user_id, last_read_at DESC);

-- 3) ATUALIZAR user_annotations - adicionar novas colunas
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS drawing_data_compressed BYTEA;
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS stroke_width NUMERIC(5,2) DEFAULT 2;
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT false;
ALTER TABLE public.user_annotations ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1;

-- Remover is_deleted e is_private se existirem (substituídos por is_synced)
-- ALTER TABLE public.user_annotations DROP COLUMN IF EXISTS is_deleted;
-- ALTER TABLE public.user_annotations DROP COLUMN IF EXISTS is_private;

-- Novo índice para user_annotations
CREATE INDEX IF NOT EXISTS idx_user_annotations_user_book ON public.user_annotations(user_id, book_id);

-- 4) ATUALIZAR book_chat_messages - adicionar novas colunas
ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS chapter_title TEXT;
ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.book_chat_messages ADD COLUMN IF NOT EXISTS content_reference JSONB;

-- Remover context_text se existir (substituído por content_reference)
-- ALTER TABLE public.book_chat_messages DROP COLUMN IF EXISTS context_text;

-- Novos índices para book_chat_messages
CREATE INDEX IF NOT EXISTS idx_book_chat_context ON public.book_chat_messages(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_book_chat_time ON public.book_chat_messages(user_id, created_at DESC);

-- 5) ATUALIZAR fn_is_owner() com search_path
CREATE OR REPLACE FUNCTION public.fn_is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.email() = 'moisesblank@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant
GRANT EXECUTE ON FUNCTION public.fn_is_owner() TO authenticated;