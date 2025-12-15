
-- =====================================================
-- COMPLETE SECURITY FIX FOR 4 ERRORS
-- =====================================================

-- ====================
-- 1. Profiles exposure
-- ====================
-- First remove leftover policy allowing admin to view other profiles
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;


-- ====================
-- 2. Employees salary exposure
-- Move salary to dedicated table with strict owner-only access
-- ====================

-- Drop dependent views first
DROP VIEW IF EXISTS public.employees_safe;
DROP VIEW IF EXISTS public.employees_public;

-- Create compensation table
CREATE TABLE IF NOT EXISTS public.employee_compensation (
  employee_id integer PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  salario integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_compensation ENABLE ROW LEVEL SECURITY;

-- Only owner can access (not even admin)
DROP POLICY IF EXISTS "Owner only manages employee compensation" ON public.employee_compensation;
CREATE POLICY "Owner only manages employee compensation"
ON public.employee_compensation
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Migrate existing salary data to the new table
INSERT INTO public.employee_compensation (employee_id, salario)
SELECT e.id, COALESCE(e.salario, 0)
FROM public.employees e
ON CONFLICT (employee_id) DO UPDATE
SET salario = EXCLUDED.salario, updated_at = now();

-- Drop salary column from employees
ALTER TABLE public.employees DROP COLUMN IF EXISTS salario;

-- Recreate employees_safe view (now joins compensation table with masking)
CREATE VIEW public.employees_safe
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.email,
  e.telefone,
  e.horario_trabalho,
  e.responsabilidades,
  e.data_admissao,
  e.status,
  e.user_id,
  e.created_by,
  e.created_at,
  e.updated_at,
  public.get_masked_salary(COALESCE(ec.salario, 0), e.user_id) AS salario
FROM public.employees e
LEFT JOIN public.employee_compensation ec ON ec.employee_id = e.id;

-- Recreate employees_public view
CREATE VIEW public.employees_public
WITH (security_invoker = true) AS
SELECT
  id,
  nome,
  funcao,
  setor,
  email,
  status,
  created_at
FROM public.employees;

-- Grant access
GRANT SELECT ON public.employees_safe TO authenticated;
GRANT SELECT ON public.employees_public TO authenticated;


-- ====================
-- 3. MFA secrets exposure
-- Revoke SELECT on totp_secret and backup_codes
-- ====================
REVOKE SELECT (totp_secret) ON public.user_mfa_settings FROM authenticated;
REVOKE SELECT (backup_codes) ON public.user_mfa_settings FROM authenticated;
REVOKE ALL ON public.user_mfa_settings FROM anon;

-- Create policy to allow users to write MFA but not read secrets back
DROP POLICY IF EXISTS "Admin pode ver MFA" ON public.user_mfa_settings;

-- Remove duplicated policies
DROP POLICY IF EXISTS "Users manage own MFA" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Usuário gerencia próprio MFA" ON public.user_mfa_settings;

-- Single policy for MFA (users manage their own, but column-level revoke blocks secret reading)
CREATE POLICY "Users manage own MFA"
ON public.user_mfa_settings
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
