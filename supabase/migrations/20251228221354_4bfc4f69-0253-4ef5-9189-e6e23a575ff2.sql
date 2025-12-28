-- ============================================
-- PASSO 1A: Adicionar novas StudentRoles ao enum + coluna expires_at
-- CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
-- ============================================

-- 1.1 Adicionar novas roles ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno_presencial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beta_expira';

-- 1.2 Adicionar coluna expires_at em user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;