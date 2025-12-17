-- =============================================
-- POLÍTICAS DE STORAGE PARA DOCUMENTOS
-- Permite upload/visualização de documentos gerais
-- =============================================

-- Permitir que usuários autenticados façam upload na pasta documents
CREATE POLICY "Users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'arquivos' AND 
  (storage.foldername(name))[1] = 'documents'
);

-- Permitir que usuários autenticados vejam documentos
CREATE POLICY "Users can view all documents in arquivos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'arquivos' AND 
  (storage.foldername(name))[1] = 'documents'
);

-- Permitir que admins deletem documentos
CREATE POLICY "Admins can delete documents from arquivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'arquivos' AND 
  (storage.foldername(name))[1] = 'documents' AND
  is_admin_or_owner(auth.uid())
);

-- Permitir que admins atualizem documentos
CREATE POLICY "Admins can update documents in arquivos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'arquivos' AND 
  (storage.foldername(name))[1] = 'documents' AND
  is_admin_or_owner(auth.uid())
);

-- Garantir que usuários autenticados possam fazer upload em qualquer pasta do bucket arquivos
CREATE POLICY "Authenticated users can upload to arquivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'arquivos');

-- Garantir acesso público para leitura do bucket arquivos (já é público)
CREATE POLICY "Public read access to arquivos bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'arquivos');