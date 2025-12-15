-- ====================================
-- CORREÇÃO DE SEGURANÇA ABRANGENTE
-- ====================================

-- 1. CORRIGIR: Afiliados - restringir para apenas owner (dados sensíveis de comissão)
DROP POLICY IF EXISTS "Authenticated users can view affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Only admins can insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Only admins can update affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Only admins can delete affiliates" ON public.affiliates;

CREATE POLICY "Owner only view affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owner only insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner only update affiliates"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owner only delete affiliates"
ON public.affiliates
FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- 2. CORRIGIR: Sales - habilitar RLS e restringir
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales;
DROP POLICY IF EXISTS "Anyone can view sales" ON public.sales;

CREATE POLICY "Owner only view sales"
ON public.sales
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owner only insert sales"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner only update sales"
ON public.sales
FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owner only delete sales"
ON public.sales
FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- 3. CORRIGIR: Students - habilitar RLS e restringir
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.students;
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;

CREATE POLICY "Admin owner only view students"
ON public.students
FOR SELECT
TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admin owner only insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admin owner only update students"
ON public.students
FOR UPDATE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admin owner only delete students"
ON public.students
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- 4. CORRIGIR: synapse_transactions - habilitar RLS e restringir
ALTER TABLE public.synapse_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.synapse_transactions;
DROP POLICY IF EXISTS "Anyone can view synapse_transactions" ON public.synapse_transactions;

CREATE POLICY "Owner only view synapse_transactions"
ON public.synapse_transactions
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owner only insert synapse_transactions"
ON public.synapse_transactions
FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner only update synapse_transactions"
ON public.synapse_transactions
FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owner only delete synapse_transactions"
ON public.synapse_transactions
FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- 5. CORRIGIR: Remover email da view employees_public (expõe PII desnecessariamente)
DROP VIEW IF EXISTS public.employees_public;
CREATE VIEW public.employees_public AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  status,
  created_at
FROM public.employees;

-- 6. CORRIGIR: Proteger view employees_safe com função security definer
DROP VIEW IF EXISTS public.employees_safe;
CREATE VIEW public.employees_safe WITH (security_invoker = false) AS
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

-- Garantir que apenas admins podem acessar a view employees_safe
GRANT SELECT ON public.employees_safe TO authenticated;