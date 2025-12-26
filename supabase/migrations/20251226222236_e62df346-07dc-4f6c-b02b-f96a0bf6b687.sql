
-- ============================================
-- ITEM 4: STORAGE POLICIES - CORREÇÃO MÍNIMA
-- Objetivo: Restringir acesso sem quebrar funcionalidade existente
-- ============================================

-- ROLLBACK SCRIPT:
-- Executar queries DROP POLICY separadamente e recriar policies antigas

-- ==============================
-- BUCKET: aulas
-- ==============================

-- Dropar policy muito permissiva (permite todos autenticados)
DROP POLICY IF EXISTS "Alunos matriculados veem aulas" ON storage.objects;

-- Criar policy correta: owner, admin, beta, employee
CREATE POLICY "aulas_select_v2"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'aulas'
  AND (
    -- Owner e Admin
    public.is_admin_or_owner(auth.uid())
    OR
    -- Beta (aluno pagante) ou Employee
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('beta'::app_role, 'employee'::app_role)
    )
  )
);

-- ==============================
-- BUCKET: documentos
-- ==============================

-- Dropar policy muito permissiva
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

-- Manter policy de "próprios documentos" + adicionar admin/owner
-- A policy "Usuários veem próprios documentos" já existe, vamos complementar
CREATE POLICY "documentos_select_v2"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    -- Owner e Admin veem tudo
    public.is_admin_or_owner(auth.uid())
    OR
    -- Usuário vê apenas seus próprios docs (pela pasta)
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- ==============================
-- BUCKET: materiais
-- ==============================

-- Dropar policy antiga se existir versão conflitante
DROP POLICY IF EXISTS "Alunos podem ver materiais dos cursos matriculados" ON storage.objects;

-- Criar policy segura: owner, admin, beta
CREATE POLICY "materiais_select_v2"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materiais'
  AND (
    -- Owner e Admin
    public.is_admin_or_owner(auth.uid())
    OR
    -- Beta (aluno pagante)
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'beta'::app_role
    )
  )
);

-- ==============================
-- AUDIT LOG
-- ==============================
INSERT INTO public.audit_logs (action, table_name, user_id, metadata)
VALUES (
  'SECURITY_MIGRATION_P0_ITEM4',
  'storage_policies',
  auth.uid(),
  jsonb_build_object(
    'description', 'Fixed overly permissive storage policies',
    'buckets_updated', ARRAY['aulas', 'documentos', 'materiais'],
    'changes', 'Restricted SELECT to role-based access',
    'executed_at', now()
  )
);
