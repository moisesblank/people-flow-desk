-- Cleanup: remover policy INSERT legada e garantir que apenas a restritiva existe
DROP POLICY IF EXISTS "pdf_previews_authenticated_insert" ON storage.objects;

-- Verificar se a policy de upload tem WITH CHECK correto
-- (a migration anterior já criou pdf_previews_authenticated_upload com role check)