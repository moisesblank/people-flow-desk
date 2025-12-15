
-- Drop all views and recreate with security_invoker = true
DROP VIEW IF EXISTS public.employees_public;
DROP VIEW IF EXISTS public.employees_safe;
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate employees_public with security_invoker
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

-- Recreate employees_safe with security_invoker
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

-- Recreate profiles_public with security_invoker
CREATE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  avatar_url,
  level,
  xp_total,
  streak_days
FROM public.profiles;
