
-- ============================================
-- LIMPEZA FINAL: REMOVER POLICIES DUPLICADAS/CONFLITANTES
-- ============================================

-- Remover policies antigas que conflitam com as novas _v3
DROP POLICY IF EXISTS "Users can view all documents in arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados veem arquivos" ON storage.objects;
DROP POLICY IF EXISTS "godmode_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "godmode_upload_policy" ON storage.objects;

-- Remover duplicatas de admin (já existe Admin gerencia)
-- Manter as policies de admin que usam is_admin_or_owner, remover duplicatas

-- Verificar se precisa criar INSERT para arquivos (foi criado na migration anterior)
-- arquivos_insert_secure_v3 já foi criado

-- ===============================
-- LIMPAR DUPLICATAS ENA (ainda têm email hardcoded)
-- ===============================
DROP POLICY IF EXISTS "ena_raw_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "ena_raw_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "ena_raw_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "ena_transmuted_owner_all" ON storage.objects;

-- Recriar ENA policies sem email hardcoded
CREATE POLICY "ena_raw_secure_all"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'ena-assets-raw'
  AND public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  bucket_id = 'ena-assets-raw'
  AND public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "ena_transmuted_secure_all"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'ena-assets-transmuted'
  AND public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  bucket_id = 'ena-assets-transmuted'
  AND public.is_admin_or_owner(auth.uid())
);

-- ===============================
-- AUDIT LOG
-- ===============================
INSERT INTO public.audit_logs (action, table_name, user_id, metadata)
VALUES (
  'SECURITY_MIGRATION_P0_FINAL_CLEANUP',
  'storage_policies',
  auth.uid(),
  jsonb_build_object(
    'description', 'Final cleanup of duplicate/conflicting policies + removed hardcoded email from ENA',
    'policies_removed', 8,
    'executed_at', now()
  )
);
