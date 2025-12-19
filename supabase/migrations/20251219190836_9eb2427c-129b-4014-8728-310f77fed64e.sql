-- Ajustes para uploads em Arquivos Empresariais (bucket 'arquivos')
-- 1) Aumentar limite e permitir mais MIME types (PDF/Office/Imagens/ZIP)
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/zip',
    'application/x-zip-compressed'
  ]
WHERE id = 'arquivos';

-- 2) Storage policies (bucket 'arquivos')
-- Observação: policies adicionais com nomes novos para não quebrar as existentes.

-- Public read (como o bucket é público)
CREATE POLICY "Public can read arquivos bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'arquivos');

-- Authenticated users can upload
CREATE POLICY "Authenticated can upload arquivos bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'arquivos');

-- Authenticated users can update own uploads (sem folder enforcement; controle é por autenticação)
CREATE POLICY "Authenticated can update arquivos bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'arquivos')
WITH CHECK (bucket_id = 'arquivos');

-- Authenticated users can delete from bucket
CREATE POLICY "Authenticated can delete arquivos bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'arquivos');

-- 3) Garantir acesso à tabela de metadados public.arquivos
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read arquivos metadata"
ON public.arquivos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert arquivos metadata"
ON public.arquivos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update arquivos metadata"
ON public.arquivos
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete arquivos metadata"
ON public.arquivos
FOR DELETE
TO authenticated
USING (true);
