-- ============================================
-- 🌌🔥 LIVROS DO MOISA — OMEGA ULTRA 🔥🌌
-- MELHORIAS E COMPLEMENTOS (CORRIGIDO)
-- ============================================

-- 8) CRIAR TABELA user_bookmarks SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT,
  note TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  UNIQUE(user_id, book_id, page_number)
);

-- RLS para user_bookmarks
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_bookmarks_own" ON public.user_bookmarks;
CREATE POLICY "user_bookmarks_own" ON public.user_bookmarks
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR (SELECT (auth.jwt() ->> 'email') = 'moisesblank@gmail.com'));

-- 9) ÍNDICES ADICIONAIS
CREATE INDEX IF NOT EXISTS idx_web_books_search ON public.web_books USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_book ON public.user_bookmarks(user_id, book_id);

-- 10) TRIGGER PARA TSVECTOR NAS PÁGINAS
CREATE OR REPLACE FUNCTION public.update_page_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.text_content_searchable := to_tsvector('portuguese', coalesce(NEW.text_content, '') || ' ' || coalesce(NEW.chapter_title, '') || ' ' || coalesce(NEW.section_title, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_page_search ON public.web_book_pages;
CREATE TRIGGER trg_page_search
  BEFORE INSERT OR UPDATE ON public.web_book_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_page_search_vector();

-- 11) GRANTS
GRANT ALL ON public.user_bookmarks TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_page_search_vector TO authenticated;