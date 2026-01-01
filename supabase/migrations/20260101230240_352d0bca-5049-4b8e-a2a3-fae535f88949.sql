-- Adicionar coluna image_urls para suportar múltiplas imagens no enunciado
-- Mantém retrocompatibilidade com image_url existente

ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.quiz_questions.image_urls IS 'Array de URLs de imagens do enunciado. Ex: ["url1", "url2", "url3"]. Complementa image_url para múltiplas imagens.';