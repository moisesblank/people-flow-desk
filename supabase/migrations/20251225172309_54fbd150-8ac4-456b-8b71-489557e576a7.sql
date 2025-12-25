
-- ============================================
-- MIGRAÇÃO CRÍTICA: Adicionar roles suporte e marketing (CORRIGIDA)
-- ============================================

-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'suporte';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';

-- 2. Criar função has_role otimizada que aceita app_role diretamente
CREATE OR REPLACE FUNCTION public.has_role_typed(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Atualizar função has_role para aceitar text e converter
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar se o role existe no enum
  IF _role NOT IN ('owner', 'admin', 'moderator', 'user', 'employee', 'suporte', 'marketing') THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  );
END;
$$;

-- 4. Criar função para verificar se é suporte (usando is_owner com argumento explícito)
CREATE OR REPLACE FUNCTION public.is_suporte(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'suporte'::app_role
  ) OR public.is_owner(_user_id)
$$;

-- 5. Criar função para verificar se é marketing (usando is_owner com argumento explícito)
CREATE OR REPLACE FUNCTION public.is_marketing(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'marketing'::app_role
  ) OR public.is_owner(_user_id)
$$;

-- 6. Criar função para verificar qualquer role de gestão
CREATE OR REPLACE FUNCTION public.is_gestao_staff(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('owner'::app_role, 'admin'::app_role, 'employee'::app_role, 'suporte'::app_role, 'marketing'::app_role)
  ) OR public.is_owner(_user_id)
$$;
