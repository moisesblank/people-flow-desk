-- Adicionar coluna de imagem na tabela quiz_questions
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.quiz_questions.image_url IS 'URL da imagem do enunciado da questão';