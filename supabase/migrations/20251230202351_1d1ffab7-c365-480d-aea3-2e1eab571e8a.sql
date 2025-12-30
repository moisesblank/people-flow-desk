-- Criar bucket público para assets de categorias de livros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-category-assets', 'book-category-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política para leitura pública
CREATE POLICY "Acesso público para leitura de assets de categorias"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-category-assets');

-- Política para upload por admins/owner
CREATE POLICY "Upload de assets de categorias por gestão"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-category-assets'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);