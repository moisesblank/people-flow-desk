-- Fix: Drop the security definer view employees_safe and recreate properly
DROP VIEW IF EXISTS public.employees_safe;

-- Recreate as a regular view (inherits RLS from base table)
CREATE VIEW public.employees_safe AS
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
  -- Use the masked salary function
  public.get_masked_salary(salario, user_id) as salario
FROM public.employees;