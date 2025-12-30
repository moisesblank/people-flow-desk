-- =====================================================
-- SISTEMA DE ANOTAÇÕES DO ALUNO - MODO LEITURA
-- Anotações, Marcações e Favoritos por livro/página
-- =====================================================

-- 1. Tabela de Anotações/Notas do Aluno
CREATE TABLE public.book_user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotation_type TEXT NOT NULL DEFAULT 'note' CHECK (annotation_type IN ('note', 'highlight', 'question', 'important')),
  content TEXT NOT NULL,
  color TEXT DEFAULT '#ef4444',
  position_x NUMERIC,
  position_y NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_page_number CHECK (page_number > 0)
);

-- 2. Tabela de Favoritos/Bookmarks do Aluno
CREATE TABLE public.book_user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  label TEXT,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_page_number CHECK (page_number > 0),
  CONSTRAINT unique_user_book_page UNIQUE (user_id, book_id, page_number)
);

-- 3. Índices para performance
CREATE INDEX idx_book_annotations_user_book ON public.book_user_annotations(user_id, book_id);
CREATE INDEX idx_book_annotations_page ON public.book_user_annotations(book_id, page_number);
CREATE INDEX idx_book_bookmarks_user_book ON public.book_user_bookmarks(user_id, book_id);

-- 4. Enable RLS
ALTER TABLE public.book_user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Anotações (cada aluno vê apenas suas próprias)
CREATE POLICY "Users can view own annotations"
  ON public.book_user_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own annotations"
  ON public.book_user_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations"
  ON public.book_user_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
  ON public.book_user_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies - Bookmarks (cada aluno vê apenas seus próprios)
CREATE POLICY "Users can view own bookmarks"
  ON public.book_user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.book_user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON public.book_user_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.book_user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Trigger para updated_at
CREATE TRIGGER update_book_annotations_updated_at
  BEFORE UPDATE ON public.book_user_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Owner pode ver tudo (para auditoria)
CREATE POLICY "Owner can view all annotations"
  ON public.book_user_annotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owner can view all bookmarks"
  ON public.book_user_bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );