-- 1. CORRIGIR profiles - apenas o próprio usuário ou owner pode ver
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Usuário vê APENAS seu próprio perfil
CREATE POLICY "Users can only view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Owner pode ver todos os perfis
CREATE POLICY "Owner can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Admin pode ver todos os perfis
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. CORRIGIR affiliates - garantir que apenas admin/owner tem acesso
DROP POLICY IF EXISTS "Only admin can manage affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Owner/Admin manages affiliates" ON public.affiliates;

-- Política restritiva: apenas owner/admin autenticados
CREATE POLICY "Strict admin access to affiliates" 
ON public.affiliates 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND is_admin_or_owner(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_admin_or_owner(auth.uid())
);

-- 3. CORRIGIR employees_safe view - adicionar security barrier
DROP VIEW IF EXISTS public.employees_safe;

-- Recriar view com security_invoker E security_barrier
CREATE OR REPLACE VIEW public.employees_safe 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.data_admissao,
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN e.email 
    ELSE NULL 
  END as email,
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN e.telefone 
    ELSE NULL 
  END as telefone,
  e.horario_trabalho,
  e.responsabilidades,
  e.created_at,
  e.created_by,
  e.user_id,
  e.updated_at,
  get_masked_salary(e.salario::numeric, e.user_id) as salario
FROM public.employees e
WHERE 
  is_admin_or_owner(auth.uid()) 
  OR e.user_id = auth.uid();