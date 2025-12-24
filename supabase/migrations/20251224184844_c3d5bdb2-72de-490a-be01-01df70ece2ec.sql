-- ============================================
-- 🔒 CORREÇÃO EMERGENCIAL: Buckets Privados
-- LEI VII - Proteção de Conteúdo
-- ============================================

-- 1. Tornar bucket 'arquivos' PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'arquivos';

-- 2. Tornar bucket 'avatars' PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- ============================================
-- NOVAS POLÍTICAS RLS PARA ACESSO SEGURO
-- ============================================

-- Política para avatars: usuário pode ver apenas seu próprio avatar
DROP POLICY IF EXISTS "Usuarios veem proprio avatar" ON storage.objects;
CREATE POLICY "Usuarios veem proprio avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Owner/Admin vê todos
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    OR
    -- Usuário vê seu próprio avatar
    (storage.foldername(name))[1] = 'avatars' 
    AND (
      name LIKE auth.uid()::text || '-%'
      OR name LIKE 'avatars/' || auth.uid()::text || '-%'
    )
    OR
    -- Acesso geral para visualização de avatares (perfis públicos)
    bucket_id = 'avatars'
  )
);

-- Política para upload de avatars
DROP POLICY IF EXISTS "Usuarios podem fazer upload de avatar" ON storage.objects;
CREATE POLICY "Usuarios podem fazer upload de avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

-- Política para atualização de avatars
DROP POLICY IF EXISTS "Usuarios podem atualizar avatar" ON storage.objects;
CREATE POLICY "Usuarios podem atualizar avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

-- Política para deletar avatar
DROP POLICY IF EXISTS "Usuarios podem deletar avatar" ON storage.objects;
CREATE POLICY "Usuarios podem deletar avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    OR
    name LIKE auth.uid()::text || '-%'
    OR name LIKE 'avatars/' || auth.uid()::text || '-%'
  )
);

-- Política para arquivos: apenas usuários autenticados com roles adequadas
DROP POLICY IF EXISTS "Usuarios autenticados veem arquivos" ON storage.objects;
CREATE POLICY "Usuarios autenticados veem arquivos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'arquivos' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'employee', 'beta')
  )
);

-- Política para upload de arquivos
DROP POLICY IF EXISTS "Usuarios podem fazer upload arquivos" ON storage.objects;
CREATE POLICY "Usuarios podem fazer upload arquivos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'arquivos' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'employee')
  )
);

-- Política para atualização de arquivos
DROP POLICY IF EXISTS "Admin pode atualizar arquivos" ON storage.objects;
CREATE POLICY "Admin pode atualizar arquivos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'arquivos' 
  AND is_admin_or_owner(auth.uid())
);

-- Política para deletar arquivos
DROP POLICY IF EXISTS "Admin pode deletar arquivos" ON storage.objects;
CREATE POLICY "Admin pode deletar arquivos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'arquivos' 
  AND is_admin_or_owner(auth.uid())
);