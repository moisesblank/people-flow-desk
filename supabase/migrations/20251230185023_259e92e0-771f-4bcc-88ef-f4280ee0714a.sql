-- ============================================
-- WEB BOOKS — DESENHOS/TEXTO DO MODO LEITURA (POR ALUNO)
-- Persistência de strokes + textos por página
-- ============================================

CREATE TABLE IF NOT EXISTS public.book_user_page_overlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  page_number integer NOT NULL,
  strokes jsonb NOT NULL DEFAULT '[]'::jsonb,
  texts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_book_user_page_overlays_user_book
  ON public.book_user_page_overlays (user_id, book_id);

CREATE INDEX IF NOT EXISTS idx_book_user_page_overlays_book_page
  ON public.book_user_page_overlays (book_id, page_number);

ALTER TABLE public.book_user_page_overlays ENABLE ROW LEVEL SECURITY;

-- Policies: usuário só vê/edita seus próprios overlays
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'book_user_page_overlays'
      AND policyname = 'Users can view their own book overlays'
  ) THEN
    CREATE POLICY "Users can view their own book overlays"
    ON public.book_user_page_overlays
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'book_user_page_overlays'
      AND policyname = 'Users can insert their own book overlays'
  ) THEN
    CREATE POLICY "Users can insert their own book overlays"
    ON public.book_user_page_overlays
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'book_user_page_overlays'
      AND policyname = 'Users can update their own book overlays'
  ) THEN
    CREATE POLICY "Users can update their own book overlays"
    ON public.book_user_page_overlays
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'book_user_page_overlays'
      AND policyname = 'Users can delete their own book overlays'
  ) THEN
    CREATE POLICY "Users can delete their own book overlays"
    ON public.book_user_page_overlays
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_book_user_page_overlays_updated_at ON public.book_user_page_overlays;
CREATE TRIGGER set_book_user_page_overlays_updated_at
BEFORE UPDATE ON public.book_user_page_overlays
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
