-- Adicionar política de INSERT para o bucket arquivos
CREATE POLICY "Authenticated users can upload to arquivos bucket"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'arquivos'
  AND auth.role() = 'authenticated'
);

-- Garantir que qualquer pessoa autenticada pode fazer upload no bucket arquivos
CREATE POLICY "Authenticated users can insert any file to arquivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'arquivos');