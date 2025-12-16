-- Criar bucket para uploads do God Mode (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arquivos', 
  'arquivos', 
  true, 
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Owner pode fazer upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Imagens são públicas para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Owner pode deletar imagens" ON storage.objects;
DROP POLICY IF EXISTS "godmode_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "godmode_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "godmode_delete_policy" ON storage.objects;

-- Política de upload para usuários autenticados
CREATE POLICY "godmode_upload_policy" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'arquivos' 
  AND (storage.foldername(name))[1] = 'godmode'
);

-- Política de leitura pública
CREATE POLICY "godmode_select_policy" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'arquivos');

-- Política de delete para owner
CREATE POLICY "godmode_delete_policy" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'arquivos' 
  AND (storage.foldername(name))[1] = 'godmode'
);