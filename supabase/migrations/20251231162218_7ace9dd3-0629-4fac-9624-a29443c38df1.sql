-- Permitir que owner/admin gerenciem (insert/update/delete/select) mídia de flashcards no bucket materiais
-- Mantém escopo mínimo: somente pasta flashcards/
DROP POLICY IF EXISTS "Admin gerencia materiais flashcards" ON storage.objects;
CREATE POLICY "Admin gerencia materiais flashcards"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'materiais'
  AND is_admin_or_owner(auth.uid())
  AND (storage.foldername(name))[1] = 'flashcards'
)
WITH CHECK (
  bucket_id = 'materiais'
  AND is_admin_or_owner(auth.uid())
  AND (storage.foldername(name))[1] = 'flashcards'
);
