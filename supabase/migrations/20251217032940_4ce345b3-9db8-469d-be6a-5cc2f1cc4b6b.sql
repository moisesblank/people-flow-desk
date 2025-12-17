-- Recriar view employees_safe com todos os campos necessários
DROP VIEW IF EXISTS public.employees_safe;
CREATE VIEW public.employees_safe 
WITH (security_invoker = true)
AS 
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.email,
  e.data_admissao,
  e.telefone,
  e.horario_trabalho,
  e.responsabilidades,
  -- Salário mascarado - somente admins veem
  public.get_masked_salary(ec.salario, e.user_id) as salario
FROM public.employees e
LEFT JOIN public.employee_compensation ec ON e.id = ec.employee_id;