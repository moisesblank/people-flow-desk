-- ============================================
-- PDF PREVIEW SYSTEM - Schema Migration
-- Adiciona suporte a previews de primeira página
-- ============================================

-- 1) Adicionar colunas em web_books
ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS preview_status TEXT DEFAULT 'pending' 
  CHECK (preview_status IN ('pending', 'processing', 'ready', 'error', 'skipped'));

-- 2) Adicionar colunas em arquivos_universal  
ALTER TABLE public.arquivos_universal
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS preview_status TEXT DEFAULT 'pending'
  CHECK (preview_status IN ('pending', 'processing', 'ready', 'error', 'skipped'));

-- 3) Criar bucket público para previews
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-previews', 
  'pdf-previews', 
  true,
  5242880, -- 5MB max (previews são pequenas)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 4) RLS para bucket pdf-previews (leitura pública, escrita autenticada)
CREATE POLICY "pdf_previews_public_read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pdf-previews');

CREATE POLICY "pdf_previews_authenticated_insert" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pdf-previews');

CREATE POLICY "pdf_previews_authenticated_update" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'pdf-previews');

CREATE POLICY "pdf_previews_authenticated_delete" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'pdf-previews');

-- 5) Índices para queries de backfill
CREATE INDEX IF NOT EXISTS idx_web_books_preview_status 
ON public.web_books(preview_status) 
WHERE preview_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_arquivos_preview_status 
ON public.arquivos_universal(preview_status) 
WHERE preview_status = 'pending' AND tipo = 'application/pdf';

-- 6) Comentários
COMMENT ON COLUMN public.web_books.preview_url IS 'URL da imagem de preview da primeira página do PDF';
COMMENT ON COLUMN public.web_books.preview_status IS 'Status da geração: pending, processing, ready, error, skipped';
COMMENT ON COLUMN public.arquivos_universal.preview_url IS 'URL da imagem de preview da primeira página do PDF';
COMMENT ON COLUMN public.arquivos_universal.preview_status IS 'Status da geração: pending, processing, ready, error, skipped';