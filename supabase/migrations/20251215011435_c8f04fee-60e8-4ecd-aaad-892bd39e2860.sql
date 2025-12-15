-- =====================================================
-- AUDITORIA DE SEGURANÇA: CORREÇÃO DE POLÍTICAS RLS
-- =====================================================

-- 1. AFFILIATES - Adicionar SELECT policy
CREATE POLICY "Affiliates select admin only" 
ON public.affiliates 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 2. STUDENTS - Adicionar SELECT policy  
CREATE POLICY "Students select admin only" 
ON public.students 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 3. SALES - Adicionar SELECT policy
CREATE POLICY "Sales select admin only" 
ON public.sales 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 4. EMPLOYEES - Adicionar SELECT policy para admin (sem ser o próprio)
CREATE POLICY "Employees select admin full access" 
ON public.employees 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 5. PAYMENTS - Adicionar SELECT policy
CREATE POLICY "Payments select admin only" 
ON public.payments 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 6. INCOME - Adicionar SELECT policy
CREATE POLICY "Income select admin only" 
ON public.income 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 7. CONTABILIDADE - Adicionar SELECT policy
CREATE POLICY "Contabilidade select admin only" 
ON public.contabilidade 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 8. COMPANY_FIXED_EXPENSES - Adicionar SELECT policy
CREATE POLICY "Company fixed expenses select admin only" 
ON public.company_fixed_expenses 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 9. COMPANY_EXTRA_EXPENSES - Adicionar SELECT policy
CREATE POLICY "Company extra expenses select admin only" 
ON public.company_extra_expenses 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 10. TAXES - Adicionar SELECT policy
CREATE POLICY "Taxes select admin only" 
ON public.taxes 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 11. ARQUIVOS - Adicionar SELECT policy
CREATE POLICY "Arquivos select admin only" 
ON public.arquivos 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 12. CALENDAR_TASKS - Adicionar SELECT policy (já tem mas vamos garantir)
CREATE POLICY "Calendar tasks select own or admin" 
ON public.calendar_tasks 
FOR SELECT 
USING ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid()));

-- 13. METRICAS_MARKETING - Adicionar SELECT policy
CREATE POLICY "Metricas marketing select admin only" 
ON public.metricas_marketing 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 14. PROFESSOR_CHECKLISTS - Adicionar SELECT policy
CREATE POLICY "Professor checklists select admin only" 
ON public.professor_checklists 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 15. WEBSITE_PENDENCIAS - Adicionar SELECT policy
CREATE POLICY "Website pendencias select admin only" 
ON public.website_pendencias 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));