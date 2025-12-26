
-- ============================================
-- LIMPEZA FINAL: INSERTs PÚBLICOS PERIGOSOS
-- ============================================

-- Remover INSERTs públicos sem verificação de role
DROP POLICY IF EXISTS "Usuarios podem fazer upload de avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem fazer upload arquivos" ON storage.objects;

-- Service uploads whatsapp e Admin materiais são necessários para backend - manter

-- Remover duplicatas de INSERT
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode atualizar arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode deletar arquivos" ON storage.objects;

-- ===============================
-- AUDIT LOG
-- ===============================
INSERT INTO public.audit_logs (action, table_name, user_id, metadata)
VALUES (
  'SECURITY_MIGRATION_P0_INSERT_CLEANUP',
  'storage_policies',
  auth.uid(),
  jsonb_build_object(
    'description', 'Removed dangerous public INSERT policies',
    'policies_removed', 5,
    'executed_at', now()
  )
);
