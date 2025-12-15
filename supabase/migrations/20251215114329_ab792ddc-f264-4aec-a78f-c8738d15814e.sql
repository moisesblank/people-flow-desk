-- Corrigir as views com security_barrier em vez de security definer
-- E corrigir as demais políticas RLS para exigir autenticação

-- 1. Remover e recriar views sem security definer (usar security_invoker)
DROP VIEW IF EXISTS public.employees_safe;
DROP VIEW IF EXISTS public.profiles_public;

-- Recriar views com security_invoker (default, mais seguro)
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  avatar_url
FROM public.profiles;

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
  e.telefone,
  e.data_admissao,
  e.horario_trabalho,
  e.responsabilidades,
  e.created_at,
  e.updated_at,
  e.user_id,
  e.created_by,
  get_masked_salary(e.salario, e.user_id) as salario
FROM public.employees e;

-- 2. Corrigir demais políticas para tabelas admin (TO authenticated)
DROP POLICY IF EXISTS "Admin manages affiliates" ON public.affiliates;
CREATE POLICY "Admin manages affiliates" ON public.affiliates
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admin manages analytics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Public insert analytics" ON public.analytics_metrics;
CREATE POLICY "Admin manages analytics" ON public.analytics_metrics
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));
-- Permitir insert público para analytics (necessário para tracking)
CREATE POLICY "Public insert analytics" ON public.analytics_metrics
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manages arquivos" ON public.arquivos;
CREATE POLICY "Admin manages arquivos" ON public.arquivos
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
CREATE POLICY "Owner can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admin gerencia badges" ON public.badges;
DROP POLICY IF EXISTS "Badges são públicos" ON public.badges;
CREATE POLICY "Admin gerencia badges" ON public.badges
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Badges são públicos" ON public.badges
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin manages company extra expenses" ON public.company_extra_expenses;
CREATE POLICY "Admin manages company extra expenses" ON public.company_extra_expenses
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admin manages company fixed expenses" ON public.company_fixed_expenses;
CREATE POLICY "Admin manages company fixed expenses" ON public.company_fixed_expenses
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admin manages contabilidade" ON public.contabilidade;
CREATE POLICY "Admin manages contabilidade" ON public.contabilidade
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admin gerencia cursos" ON public.courses;
DROP POLICY IF EXISTS "Cursos publicados são públicos" ON public.courses;
CREATE POLICY "Admin gerencia cursos" ON public.courses
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Cursos publicados são públicos" ON public.courses
FOR SELECT TO authenticated
USING (is_published = true);

DROP POLICY IF EXISTS "Admin manages rules" ON public.custom_rules;
CREATE POLICY "Admin manages rules" ON public.custom_rules
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view themselves" ON public.employees;
CREATE POLICY "Admin can manage employees" ON public.employees
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Employees can view themselves" ON public.employees
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin gerencia matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Usuário vê próprias matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Usuário pode se matricular" ON public.enrollments;
CREATE POLICY "Admin gerencia matrículas" ON public.enrollments
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Usuário vê próprias matrículas" ON public.enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Usuário pode se matricular" ON public.enrollments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());