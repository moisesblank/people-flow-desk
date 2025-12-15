
-- FIX 1: Security Definer View - Recreate employees_safe with security_invoker
DROP VIEW IF EXISTS public.employees_safe;

CREATE VIEW public.employees_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  email,
  telefone,
  horario_trabalho,
  responsabilidades,
  data_admissao,
  status,
  user_id,
  created_by,
  created_at,
  updated_at,
  public.get_masked_salary(salario, user_id) as salario
FROM public.employees;

-- FIX 2: Profiles - Drop all existing policies and create restrictive ones
DROP POLICY IF EXISTS "Profiles access control" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin manages profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles são públicos para leitura" ON public.profiles;

-- Only allow users to see their own profile
CREATE POLICY "Users view own profile only"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users update own profile only"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users insert own profile only"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users delete own profile only"
ON public.profiles
FOR DELETE
USING (id = auth.uid());

-- FIX 3: Affiliates - Restrict to ONLY owner (not admin)
DROP POLICY IF EXISTS "Affiliates restricted to admin owner" ON public.affiliates;
DROP POLICY IF EXISTS "Strict admin access to affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_owner_manage" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_owner_only" ON public.affiliates;
DROP POLICY IF EXISTS "Only owner can manage affiliates" ON public.affiliates;

CREATE POLICY "Owner only manages affiliates"
ON public.affiliates
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));
