-- Adicionar colunas que faltam na tabela web_books para o Genesis v2

ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS original_mime_type TEXT DEFAULT 'application/pdf';

ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS status_message TEXT;

ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS original_checksum TEXT;

ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slug (quando não nulo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_web_books_slug_unique 
ON public.web_books(slug) 
WHERE slug IS NOT NULL;

-- Comentários descritivos
COMMENT ON COLUMN public.web_books.original_mime_type IS 'Tipo MIME do arquivo original (PDF, EPUB, etc)';
COMMENT ON COLUMN public.web_books.status_message IS 'Mensagem detalhada do status atual';
COMMENT ON COLUMN public.web_books.original_checksum IS 'Hash do arquivo original para verificação de integridade';
COMMENT ON COLUMN public.web_books.slug IS 'URL amigável única para o livro';