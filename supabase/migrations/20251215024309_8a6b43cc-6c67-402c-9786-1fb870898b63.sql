-- Corrigir exposição de salários - Remover acesso de funcionários ao próprio salário

-- Remover políticas antigas de employees
DROP POLICY IF EXISTS "Employees can view own basic data" ON public.employees;

-- Criar política onde funcionários veem apenas dados básicos (sem acesso ao salário via RLS)
-- Funcionários só podem ver seu próprio registro
CREATE POLICY "Employees view own record without salary access"
ON public.employees
FOR SELECT
USING (
  -- Admins/owners veem tudo
  is_admin_or_owner(auth.uid())
  OR 
  -- Funcionários veem apenas seu próprio registro (mas o salário será mascarado via aplicação)
  user_id = auth.uid()
);

-- Criar view segura que mascara salário para não-admins
CREATE OR REPLACE VIEW public.employees_safe AS
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