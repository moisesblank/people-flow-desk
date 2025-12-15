-- Corrigir view SECURITY DEFINER - Remover e recriar sem SECURITY DEFINER
DROP VIEW IF EXISTS public.employees_safe;

-- Recriar view com SECURITY INVOKER (padrão seguro)
CREATE VIEW public.employees_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  funcao,
  email,
  telefone,
  setor,
  status,
  horario_trabalho,
  responsabilidades,
  data_admissao,
  user_id,
  created_at,
  updated_at,
  created_by,
  -- Mascarar salário: só mostra para admin/owner
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN salario
    ELSE NULL
  END as salario
FROM public.employees;

-- Dar permissão de SELECT na view para usuários autenticados
GRANT SELECT ON public.employees_safe TO authenticated;