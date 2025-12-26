-- ============================================
-- P0 #1: MIGRAR is_owner() DE EMAIL PARA ROLE
-- ANTES: Verificava email hardcoded (RISCO CRÍTICO)
-- DEPOIS: Verifica role='owner' via user_roles (SEGURO)
-- ============================================

-- 1. Substituir função is_owner por verificação baseada em role
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'owner'::app_role
  )
$$;

-- 2. Atualizar is_admin_or_owner para usar a nova is_owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner'::app_role, 'admin'::app_role)
  )
$$;

-- 3. Atualizar has_role para consistência
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- 4. Criar função auxiliar is_owner_by_email para LOGS/AUDIT ONLY (não para permissões!)
-- Esta função é APENAS para auditoria e logs, NUNCA para controle de acesso
CREATE OR REPLACE FUNCTION public.is_owner_by_email_audit_only(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'owner'::app_role
    AND LOWER(u.email) = LOWER(_email)
  )
$$;

-- 5. Log da migração de segurança
INSERT INTO public.security_events (event_type, severity, source, description, payload)
VALUES (
  'SECURITY_MIGRATION',
  'critical',
  'p0_migration',
  'is_owner() migrado de email hardcoded para role-based (user_roles)',
  jsonb_build_object(
    'before', 'email hardcoded moisesblank@gmail.com',
    'after', 'role=owner via user_roles',
    'migration_date', NOW(),
    'risk_eliminated', 'email spoofing / identity theft'
  )
);