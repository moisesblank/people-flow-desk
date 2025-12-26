
-- ============================================
-- P0 CRÍTICO: LIMPEZA TOTAL DE POLICIES DE STORAGE
-- Data: 2025-12-26
-- Objetivo: Remover todas policies muito permissivas
-- ============================================

-- ROLLBACK: Se quebrar, recriar policies individualmente

-- ===============================
-- BUCKET: arquivos — REMOVER LEITURA PÚBLICA
-- ===============================

-- Remover TODAS as policies de leitura pública do bucket arquivos
DROP POLICY IF EXISTS "Leitura pública arquivos storage" ON storage.objects;
DROP POLICY IF EXISTS "Public can read arquivos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to arquivos bucket" ON storage.objects;
DROP POLICY IF EXISTS "godmode_select_policy" ON storage.objects;

-- Remover policies de INSERT muito permissivas
DROP POLICY IF EXISTS "Authenticated can upload arquivos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert any file to arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to arquivos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Upload autenticado arquivos storage" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_upload_authenticated" ON storage.objects;

-- Remover policies de DELETE/UPDATE muito permissivas
DROP POLICY IF EXISTS "Authenticated can delete arquivos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update arquivos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Delete autenticado arquivos storage" ON storage.objects;
DROP POLICY IF EXISTS "Update autenticado arquivos storage" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_update_authenticated" ON storage.objects;

-- ===============================
-- BUCKET: documentos — REMOVER INSERT PERMISSIVO
-- ===============================
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

-- ===============================
-- CRIAR POLICIES SEGURAS PARA ARQUIVOS
-- ===============================

-- SELECT: Apenas roles permitidas (owner, admin, employee, beta)
CREATE POLICY "arquivos_select_secure_v3"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'arquivos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner'::app_role, 'admin'::app_role, 'employee'::app_role, 'beta'::app_role)
  )
);

-- INSERT: Apenas owner, admin, employee
CREATE POLICY "arquivos_insert_secure_v3"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'arquivos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner'::app_role, 'admin'::app_role, 'employee'::app_role)
  )
);

-- UPDATE: Apenas owner, admin, employee
CREATE POLICY "arquivos_update_secure_v3"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'arquivos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner'::app_role, 'admin'::app_role, 'employee'::app_role)
  )
);

-- DELETE: Apenas owner, admin
CREATE POLICY "arquivos_delete_secure_v3"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'arquivos'
  AND public.is_admin_or_owner(auth.uid())
);

-- ===============================
-- BUCKET: documentos — CRIAR INSERT SEGURO
-- ===============================
CREATE POLICY "documentos_insert_secure_v3"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND (
    -- Owner e Admin podem fazer upload
    public.is_admin_or_owner(auth.uid())
    OR
    -- Usuário pode fazer upload na própria pasta
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- ===============================
-- AUDIT LOG
-- ===============================
INSERT INTO public.audit_logs (action, table_name, user_id, metadata)
VALUES (
  'SECURITY_MIGRATION_P0_STORAGE_CLEANUP',
  'storage_policies',
  auth.uid(),
  jsonb_build_object(
    'description', 'Removed all overly permissive storage policies',
    'buckets_cleaned', ARRAY['arquivos', 'documentos'],
    'policies_removed', 17,
    'policies_created', 5,
    'executed_at', now()
  )
);
