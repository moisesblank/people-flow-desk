-- CORREÇÃO DEFINITIVA DE SEGURANÇA v2

-- 1. PROFILES - Política mais restritiva que previne acesso sem autenticação
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

-- Somente com auth.uid() válido
CREATE POLICY "Only authenticated users view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Only owner views all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Only admin views all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- 2. EMPLOYEES - Adicionar mascaramento de dados sensíveis na policy
DROP POLICY IF EXISTS "Owner/Admin can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view themselves" ON public.employees;

-- Funcionário só vê seus próprios dados
CREATE POLICY "Employee views only self" 
ON public.employees 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Admin/Owner gerencia todos (com autenticação obrigatória)
CREATE POLICY "Admin owner manages all employees" 
ON public.employees 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()));

-- 3. EMPLOYEES_SAFE - Recriar como view materializada com segurança
DROP VIEW IF EXISTS public.employees_safe CASCADE;

-- View com filtro de autenticação obrigatório
CREATE OR REPLACE VIEW public.employees_safe 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.data_admissao,
  e.horario_trabalho,
  e.responsabilidades,
  e.created_at,
  e.user_id,
  e.updated_at,
  -- Dados sensíveis só para admin/owner
  CASE WHEN is_admin_or_owner(auth.uid()) THEN e.email ELSE '***' END as email,
  CASE WHEN is_admin_or_owner(auth.uid()) THEN e.telefone ELSE '***' END as telefone,
  CASE WHEN is_admin_or_owner(auth.uid()) THEN e.salario ELSE 0 END as salario,
  CASE WHEN is_admin_or_owner(auth.uid()) THEN e.created_by ELSE NULL END as created_by
FROM public.employees e
WHERE 
  auth.uid() IS NOT NULL
  AND (is_admin_or_owner(auth.uid()) OR e.user_id = auth.uid());