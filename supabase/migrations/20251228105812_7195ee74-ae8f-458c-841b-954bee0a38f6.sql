-- ============================================
-- ADICIONAR colunas de rating em web_books
-- 
-- CONTEXTO: Essas colunas são usadas pelo trigger 
-- update_book_rating_stats() para armazenar a média
-- e contagem de avaliações dos livros digitais.
-- 
-- NOTA: Plataforma em construção, colunas iniciam com 0
-- e serão preenchidas quando alunos avaliarem os livros.
-- ============================================

-- Adicionar coluna rating_average (média das avaliações)
ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) DEFAULT 0;

-- Adicionar coluna rating_count (quantidade de avaliações)
ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.web_books.rating_average IS 'Média das avaliações do livro (0-5). Atualizado automaticamente via trigger.';
COMMENT ON COLUMN public.web_books.rating_count IS 'Quantidade de avaliações do livro. Atualizado automaticamente via trigger.';