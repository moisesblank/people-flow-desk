
-- ============================================
-- ITEM 3: CORRIGIR is_owner() - REMOVER EMAIL HARDCODED
-- Data: 2025-12-26
-- Objetivo: Garantir que APENAS a versão role-based seja usada
-- ============================================

-- ROLLBACK SCRIPT (para emergência - executar separadamente):
-- DROP FUNCTION IF EXISTS public.is_owner() CASCADE;
-- Depois: restaurar função antiga se necessário

-- PASSO 1: Dropar a versão antiga SEM parâmetro (que usa email hardcoded)
DROP FUNCTION IF EXISTS public.is_owner() CASCADE;

-- PASSO 2: Criar versão única e segura baseada em role
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'owner'::app_role
  )
$$;

-- PASSO 3: Garantir que is_admin_or_owner() use a nova função
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner'::app_role, 'admin'::app_role)
  )
$$;

-- PASSO 4: Audit log da migração
INSERT INTO public.audit_logs (action, table_name, user_id, metadata)
VALUES (
  'SECURITY_MIGRATION_P0_ITEM3',
  'is_owner_function',
  auth.uid(),
  jsonb_build_object(
    'description', 'Migrated is_owner() from hardcoded email to role-based check',
    'old_method', 'email = moisesblank@gmail.com',
    'new_method', 'role = owner in user_roles',
    'executed_at', now()
  )
);

-- PASSO 5: Criar função de auditoria (readonly, apenas para verificação histórica)
CREATE OR REPLACE FUNCTION public.is_owner_legacy_email_check(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- DEPRECATED: Apenas para auditoria, NÃO usar para autenticação
  -- Retorna false sempre para forçar uso de role-based
  SELECT false
$$;

COMMENT ON FUNCTION public.is_owner_legacy_email_check(_email text) IS 
'DEPRECATED: Função de auditoria apenas. Sempre retorna false. Use is_owner(_user_id) para verificação real.';
