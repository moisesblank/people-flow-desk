-- Tornar bucket avatars público para permitir acesso às fotos
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Dropar políticas existentes se houver e recriar
DROP POLICY IF EXISTS "Fotos de avatar são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de avatars" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar avatars" ON storage.objects;

-- Criar política para permitir leitura pública das fotos
CREATE POLICY "Fotos de avatar são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Criar política para permitir upload autenticado
CREATE POLICY "Usuários autenticados podem fazer upload de avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Criar política para permitir atualização de avatars
CREATE POLICY "Usuários autenticados podem atualizar avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');