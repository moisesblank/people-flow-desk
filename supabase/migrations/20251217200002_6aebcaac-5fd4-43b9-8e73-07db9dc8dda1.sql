-- ============================================
-- SECURITY FIX v19.1 - Views e tabelas restantes
-- ============================================

-- Remover views públicas e criar com RLS apropriado
DROP VIEW IF EXISTS public.employees_public;
DROP VIEW IF EXISTS public.employees_safe;
DROP VIEW IF EXISTS public.profiles_public;

-- Recriar employees_public com segurança (SECURITY INVOKER herda RLS)
CREATE OR REPLACE VIEW public.employees_public 
WITH (security_invoker = true) 
AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  status,
  horario_trabalho,
  data_admissao
FROM public.employees;

-- Recriar employees_safe com segurança (só admin/owner vê salários)
CREATE OR REPLACE VIEW public.employees_safe 
WITH (security_invoker = true) 
AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.email,
  e.telefone,
  e.horario_trabalho,
  e.data_admissao,
  e.responsabilidades,
  ec.salario
FROM public.employees e
LEFT JOIN public.employee_compensation ec ON e.id = ec.employee_id;

-- Recriar profiles_public com segurança
CREATE OR REPLACE VIEW public.profiles_public 
WITH (security_invoker = true) 
AS
SELECT 
  id,
  nome,
  avatar_url,
  is_online
FROM public.profiles;

-- Garantir RLS em tabelas base
-- ALUNOS - Restringir a admin/owner/coordenação
DROP POLICY IF EXISTS "Admin can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Coordenacao can view alunos" ON public.alunos;

CREATE POLICY "Admin can manage alunos" 
ON public.alunos 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Coordenacao can view alunos" 
ON public.alunos 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'coordenacao')
);

-- AFFILIATES - Afiliados veem próprios dados, admin vê todos
DROP POLICY IF EXISTS "Affiliates can view own data" ON public.affiliates;
DROP POLICY IF EXISTS "Admin can manage affiliates" ON public.affiliates;

CREATE POLICY "Admin can manage affiliates" 
ON public.affiliates 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Affiliates can view own data" 
ON public.affiliates 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- WHATSAPP_LEADS - Apenas admin/owner/suporte
DROP POLICY IF EXISTS "Admin can manage whatsapp leads" ON public.whatsapp_leads;

CREATE POLICY "Admin can manage whatsapp leads" 
ON public.whatsapp_leads 
FOR ALL 
TO authenticated 
USING (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'suporte')
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'suporte')
);

-- WHATSAPP_CONVERSATIONS - Apenas admin/owner/suporte
DROP POLICY IF EXISTS "Admin can manage whatsapp conversations" ON public.whatsapp_conversations;

CREATE POLICY "Admin can manage whatsapp conversations" 
ON public.whatsapp_conversations 
FOR ALL 
TO authenticated 
USING (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'suporte')
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'suporte')
);

-- WHATSAPP_MESSAGES - Apenas admin/owner/suporte
DROP POLICY IF EXISTS "Admin can manage whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Admin can manage whatsapp messages" 
ON public.whatsapp_messages 
FOR ALL 
TO authenticated 
USING (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'suporte')
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'suporte')
);

-- WOOCOMMERCE_ORDERS - Apenas admin/owner
DROP POLICY IF EXISTS "Admin can manage woocommerce orders" ON public.woocommerce_orders;

CREATE POLICY "Admin can manage woocommerce orders" 
ON public.woocommerce_orders 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- TIME_CLOCK_ENTRIES - Funcionários veem próprios, admin vê todos
DROP POLICY IF EXISTS "Employees can view own time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Employees can insert own time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admin can manage time clock entries" ON public.time_clock_entries;

CREATE POLICY "Employees can view own time entries" 
ON public.time_clock_entries 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = time_clock_entries.employee_id 
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Employees can insert own time entries" 
ON public.time_clock_entries 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = time_clock_entries.employee_id 
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage time clock entries" 
ON public.time_clock_entries 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- USER_MFA_SETTINGS - Apenas o próprio usuário
DROP POLICY IF EXISTS "Users can manage own mfa settings" ON public.user_mfa_settings;

CREATE POLICY "Users can manage own mfa settings" 
ON public.user_mfa_settings 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());