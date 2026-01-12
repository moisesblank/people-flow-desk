-- Adicionar coluna is_public para flashcards prontos/públicos
ALTER TABLE public.study_flashcards 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Marcar todos os flashcards importados como públicos (620 cards existentes)
UPDATE public.study_flashcards 
SET is_public = TRUE 
WHERE source = 'import';

-- Criar índice para consultas de flashcards públicos
CREATE INDEX IF NOT EXISTS idx_study_flashcards_public 
ON public.study_flashcards(is_public) 
WHERE is_public = TRUE;

-- RLS: Permitir que todos os usuários autenticados LEIAM flashcards públicos
CREATE POLICY "Users can read public flashcards" 
ON public.study_flashcards 
FOR SELECT 
USING (
  is_public = TRUE 
  OR user_id = auth.uid()
);

-- Comentário explicativo
COMMENT ON COLUMN public.study_flashcards.is_public IS 'Flashcards públicos/prontos visíveis para todos os alunos';