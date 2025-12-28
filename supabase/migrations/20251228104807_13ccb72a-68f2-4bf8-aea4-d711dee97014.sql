-- ============================================
-- CORREÇÃO: Remover constraint duplicada em user_roles
-- 
-- PROBLEMA: Existem 2 constraints UNIQUE conflitantes:
-- 1. user_roles_user_id_key (user_id) → CORRETA (1 role por user)
-- 2. user_roles_unique_user_role (user_id, role) → INCORRETA (permite múltiplas roles)
-- 
-- SOLUÇÃO: Remover a constraint composta usando ALTER TABLE
-- ============================================

-- Remover a constraint composta (isso também remove o índice associado)
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_unique_user_role;

-- Remover índices redundantes de lookup (já temos idx_user_roles_user_id)
DROP INDEX IF EXISTS public.idx_user_roles_lookup;
DROP INDEX IF EXISTS public.idx_user_roles_user_role;

-- Comentário para documentação
COMMENT ON TABLE public.user_roles IS 'Tabela de roles de usuário. REGRA: 1 role por user_id (CONSTITUIÇÃO v10.x). Constraint: user_roles_user_id_key (UNIQUE user_id)';