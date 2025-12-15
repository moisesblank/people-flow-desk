-- Corrigir as views para usar security_invoker (mais seguro)
-- Isso faz com que as views respeitem as políticas RLS do usuário que consulta

-- Recriar employees_public com security_invoker
DROP VIEW IF EXISTS public.employees_public;
CREATE VIEW public.employees_public WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  status,
  created_at
FROM public.employees;

-- Recriar employees_safe com security_invoker
DROP VIEW IF EXISTS public.employees_safe;
CREATE VIEW public.employees_safe WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.email,
  e.telefone,
  e.setor,
  e.status,
  e.data_admissao,
  e.horario_trabalho,
  e.responsabilidades,
  e.user_id,
  e.created_by,
  e.created_at,
  e.updated_at,
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN ec.salario
    ELSE NULL
  END as salario
FROM public.employees e
LEFT JOIN public.employee_compensation ec ON e.id = ec.employee_id;

-- Conceder permissões
GRANT SELECT ON public.employees_public TO authenticated;
GRANT SELECT ON public.employees_safe TO authenticated;