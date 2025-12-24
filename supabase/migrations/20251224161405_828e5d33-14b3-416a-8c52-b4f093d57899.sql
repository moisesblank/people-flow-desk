-- ============================================
-- MATRIZ ÔMEGA — TABELAS FALTANTES
-- user_book_annotations + web_book_chat_messages
-- ============================================

-- 1) ANOTAÇÕES VETORIAIS DO ALUNO (desenhos, marcações)
CREATE TABLE IF NOT EXISTS public.user_book_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INT NOT NULL CHECK (page_number >= 1),
  
  -- JSON compactado (lz-string) para performance 3G
  annotation_blob TEXT NOT NULL,
  
  -- Versionamento para sync resiliente
  version INT NOT NULL DEFAULT 1,
  
  -- Metadados
  tool_used TEXT DEFAULT 'pen', -- pen, highlighter, eraser, text
  color TEXT DEFAULT '#000000',
  stroke_width INT DEFAULT 2,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint único por usuário/livro/página
  CONSTRAINT user_book_annotations_unique UNIQUE (user_id, book_id, page_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_book_annotations_user_book 
  ON public.user_book_annotations(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_annotations_book_page 
  ON public.user_book_annotations(book_id, page_number);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_user_book_annotations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_book_annotations_updated_at ON public.user_book_annotations;
CREATE TRIGGER trg_user_book_annotations_updated_at
  BEFORE UPDATE ON public.user_book_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_user_book_annotations_updated_at();

-- 2) CHAT DO LIVRO WEB (realtime)
CREATE TABLE IF NOT EXISTS public.web_book_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.web_books(id) ON DELETE CASCADE,
  page_number INT NULL, -- NULL = chat geral do livro
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conteúdo
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'question', 'answer', 'system')),
  
  -- Metadados
  reply_to UUID REFERENCES public.web_book_chat_messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_ai_response BOOLEAN NOT NULL DEFAULT false,
  
  -- Moderação
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ NULL,
  
  -- Context (para IA)
  context_text TEXT NULL, -- Trecho selecionado para perguntar
  
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_web_book_chat_book_page_created 
  ON public.web_book_chat_messages(book_id, page_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_book_chat_user 
  ON public.web_book_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_book_chat_replies 
  ON public.web_book_chat_messages(reply_to) WHERE reply_to IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ANOTAÇÕES (cada usuário só vê/edita as suas, owner vê tudo)
ALTER TABLE public.user_book_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_book_annotations_own" ON public.user_book_annotations;
CREATE POLICY "user_book_annotations_own"
  ON public.user_book_annotations
  FOR ALL
  USING (auth.uid() = user_id OR public.is_owner(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_owner(auth.uid()));

-- CHAT (beta e owner podem ver, inserir próprias mensagens)
ALTER TABLE public.web_book_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "web_book_chat_select" ON public.web_book_chat_messages;
CREATE POLICY "web_book_chat_select"
  ON public.web_book_chat_messages
  FOR SELECT
  USING (
    public.is_owner(auth.uid()) 
    OR public.is_beta_v2(auth.uid())
    OR public.is_funcionario_v2(auth.uid())
  );

DROP POLICY IF EXISTS "web_book_chat_insert" ON public.web_book_chat_messages;
CREATE POLICY "web_book_chat_insert"
  ON public.web_book_chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      public.is_owner(auth.uid()) 
      OR public.is_beta_v2(auth.uid())
    )
  );

DROP POLICY IF EXISTS "web_book_chat_update" ON public.web_book_chat_messages;
CREATE POLICY "web_book_chat_update"
  ON public.web_book_chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_owner(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "web_book_chat_delete" ON public.web_book_chat_messages;
CREATE POLICY "web_book_chat_delete"
  ON public.web_book_chat_messages
  FOR DELETE
  USING (public.is_owner(auth.uid()));

-- ============================================
-- REALTIME para chat
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.web_book_chat_messages;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.user_book_annotations IS '📝 Anotações vetoriais do aluno por página do livro web (SANCTUM 2300)';
COMMENT ON TABLE public.web_book_chat_messages IS '💬 Chat em tempo real do livro web (SANCTUM 2300)';
COMMENT ON COLUMN public.user_book_annotations.annotation_blob IS 'JSON compactado com lz-string para performance 3G';
COMMENT ON COLUMN public.user_book_annotations.version IS 'Versionamento para sync resiliente (auto-incrementa no update)';