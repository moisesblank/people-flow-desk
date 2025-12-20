-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE SEGURANÇA: Restringir acesso a dados sensíveis
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. TABELA ALUNOS - Restringir acesso apenas para owner e admin
-- Remover políticas existentes que permitem acesso amplo
DROP POLICY IF EXISTS "alunos_select_coordenacao" ON public.alunos;
DROP POLICY IF EXISTS "alunos_select_suporte" ON public.alunos;
DROP POLICY IF EXISTS "alunos_select_all" ON public.alunos;
DROP POLICY IF EXISTS "alunos_public_read" ON public.alunos;
DROP POLICY IF EXISTS "Users can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Coordenacao can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Anyone can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.alunos;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.alunos;

-- Criar política restritiva: apenas owner e admin podem ver todos os alunos
CREATE POLICY "alunos_owner_admin_full_access"
ON public.alunos
FOR ALL
USING (
  auth.uid() IN (
    SELECT ur.user_id FROM public.user_roles ur 
    WHERE ur.role IN ('owner', 'admin')
  )
  OR
  auth.jwt() ->> 'email' = 'moisesblank@gmail.com'
);

-- Política para coordenação: ver apenas dados não-sensíveis (nome, email, status)
-- Usando uma view específica em vez de acesso direto à tabela

-- 2. TABELA EMPLOYEE_COMPENSATION - Consolidar políticas
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "employee_compensation_owner_only" ON public.employee_compensation;
DROP POLICY IF EXISTS "employee_compensation_admin" ON public.employee_compensation;
DROP POLICY IF EXISTS "employee_compensation_view" ON public.employee_compensation;
DROP POLICY IF EXISTS "owner_full_access" ON public.employee_compensation;
DROP POLICY IF EXISTS "Enable read access for owner" ON public.employee_compensation;
DROP POLICY IF EXISTS "Allow owner to manage compensation" ON public.employee_compensation;

-- Criar uma ÚNICA política consolidada: APENAS owner
CREATE POLICY "compensation_owner_only_access"
ON public.employee_compensation
FOR ALL
USING (
  auth.jwt() ->> 'email' = 'moisesblank@gmail.com'
);

-- 3. Criar view segura para alunos (dados não-sensíveis para coordenação)
CREATE OR REPLACE VIEW public.alunos_safe AS
SELECT 
  id,
  nome,
  email,
  status,
  curso_id,
  data_matricula,
  cidade,
  estado,
  fonte,
  created_at
  -- CPF, telefone, data_nascimento, valor_pago EXCLUÍDOS
FROM public.alunos;

-- Política para a view alunos_safe
DROP POLICY IF EXISTS "alunos_safe_coordenacao" ON public.alunos_safe;

-- 4. Garantir que tabelas sensíveis tenham RLS ativado
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_compensation ENABLE ROW LEVEL SECURITY;

-- 5. Criar índice para melhor performance nas políticas RLS
CREATE INDEX IF NOT EXISTS idx_user_roles_role_user ON public.user_roles(role, user_id);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_employee_compensation_employee ON public.employee_compensation(employee_id);