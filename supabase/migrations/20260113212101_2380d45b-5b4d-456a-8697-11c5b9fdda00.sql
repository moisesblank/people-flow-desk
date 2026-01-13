-- ============================================
-- MIGRATION: Suporte a Imagens em Flashcards
-- TASK_ID: MM_FLASHCARD_IMAGE_SUPPORT_V1
-- ============================================

-- Adicionar campos de imagem à tabela study_flashcards
ALTER TABLE public.study_flashcards
ADD COLUMN IF NOT EXISTS question_image_url TEXT,
ADD COLUMN IF NOT EXISTS answer_image_url TEXT,
ADD COLUMN IF NOT EXISTS question_image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS answer_image_urls JSONB DEFAULT '[]'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.study_flashcards.question_image_url IS 'URL principal da imagem na pergunta (frente do card)';
COMMENT ON COLUMN public.study_flashcards.answer_image_url IS 'URL principal da imagem na resposta (verso do card)';
COMMENT ON COLUMN public.study_flashcards.question_image_urls IS 'Array de URLs de imagens adicionais na pergunta';
COMMENT ON COLUMN public.study_flashcards.answer_image_urls IS 'Array de URLs de imagens adicionais na resposta';