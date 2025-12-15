-- 1. Proteger tabela profiles - adicionar política que requer autenticação
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Owner can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'owner'::app_role));

-- 2. Proteger view employees_safe - converter para tabela segura ou adicionar função
-- A view employees_safe precisa ter SECURITY INVOKER para respeitar RLS
DROP VIEW IF EXISTS public.employees_safe;

CREATE OR REPLACE VIEW public.employees_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  status,
  data_admissao,
  email,
  telefone,
  horario_trabalho,
  responsabilidades,
  created_at,
  created_by,
  user_id,
  updated_at,
  get_masked_salary(salario::numeric, user_id) as salario
FROM public.employees;

-- 3. Reforçar políticas da tabela affiliates (já existe, mas vamos garantir)
DROP POLICY IF EXISTS "Owner/Admin manages affiliates" ON public.affiliates;

CREATE POLICY "Only admin can manage affiliates" 
ON public.affiliates 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()));

-- 4. Reforçar políticas da tabela students
DROP POLICY IF EXISTS "Owner/Admin manages students" ON public.students;

CREATE POLICY "Only admin can manage students" 
ON public.students 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()));

-- 5. Garantir que profiles_public view seja segura
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  avatar_url
FROM public.profiles
WHERE auth.uid() IS NOT NULL;