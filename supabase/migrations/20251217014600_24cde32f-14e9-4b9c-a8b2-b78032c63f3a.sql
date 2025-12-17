-- ============================================
-- SECURITY FIX v15: Proteger todas as tabelas sensíveis
-- ============================================

-- 1. PROFILES - Apenas usuário vê seu próprio perfil, admins veem todos
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. EMPLOYEES - Apenas admins/owner
DROP POLICY IF EXISTS "Employees viewable by admins" ON public.employees;
DROP POLICY IF EXISTS "Employees editable by admins" ON public.employees;
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;

CREATE POLICY "Employees viewable by admins" ON public.employees FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Employees editable by admins" ON public.employees FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 3. EMPLOYEE_COMPENSATION - Apenas owner
DROP POLICY IF EXISTS "Compensation viewable by owner" ON public.employee_compensation;
DROP POLICY IF EXISTS "Compensation editable by owner" ON public.employee_compensation;

CREATE POLICY "Compensation viewable by owner" ON public.employee_compensation FOR SELECT 
USING (public.is_owner(auth.uid()));

CREATE POLICY "Compensation editable by owner" ON public.employee_compensation FOR ALL 
USING (public.is_owner(auth.uid()));

-- 4. TRANSACTIONS - Apenas quem pode ver financeiro
DROP POLICY IF EXISTS "Transactions viewable by financial" ON public.transactions;
DROP POLICY IF EXISTS "Transactions editable by financial" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;

CREATE POLICY "Transactions viewable by financial" ON public.transactions FOR SELECT 
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "Transactions editable by financial" ON public.transactions FOR ALL 
USING (public.can_view_financial(auth.uid()));

-- 5. STUDENTS - Apenas admins
DROP POLICY IF EXISTS "Students viewable by admins" ON public.students;
DROP POLICY IF EXISTS "Students editable by admins" ON public.students;
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;

CREATE POLICY "Students viewable by admins" ON public.students FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Students editable by admins" ON public.students FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 6. AFFILIATES - Apenas admins
DROP POLICY IF EXISTS "Affiliates viewable by admins" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates editable by admins" ON public.affiliates;
DROP POLICY IF EXISTS "Anyone can view affiliates" ON public.affiliates;

CREATE POLICY "Affiliates viewable by admins" ON public.affiliates FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Affiliates editable by admins" ON public.affiliates FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 7. PAYMENTS - Apenas financeiro
DROP POLICY IF EXISTS "Payments viewable by financial" ON public.payments;
DROP POLICY IF EXISTS "Payments editable by financial" ON public.payments;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;

CREATE POLICY "Payments viewable by financial" ON public.payments FOR SELECT 
USING (public.can_view_financial(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Payments editable by financial" ON public.payments FOR ALL 
USING (public.can_view_financial(auth.uid()) OR auth.uid() = user_id);

-- 8. WHATSAPP_LEADS - Apenas admins
DROP POLICY IF EXISTS "WhatsApp leads viewable by admins" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "WhatsApp leads editable by admins" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Anyone can view whatsapp leads" ON public.whatsapp_leads;

CREATE POLICY "WhatsApp leads viewable by admins" ON public.whatsapp_leads FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "WhatsApp leads editable by admins" ON public.whatsapp_leads FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 9. WHATSAPP_MESSAGES - Apenas admins
DROP POLICY IF EXISTS "WhatsApp messages viewable by admins" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages editable by admins" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Anyone can view whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "WhatsApp messages viewable by admins" ON public.whatsapp_messages FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "WhatsApp messages editable by admins" ON public.whatsapp_messages FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 10. CONTABILIDADE - Apenas financeiro
DROP POLICY IF EXISTS "Contabilidade viewable by financial" ON public.contabilidade;
DROP POLICY IF EXISTS "Contabilidade editable by financial" ON public.contabilidade;
DROP POLICY IF EXISTS "Anyone can view contabilidade" ON public.contabilidade;

CREATE POLICY "Contabilidade viewable by financial" ON public.contabilidade FOR SELECT 
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "Contabilidade editable by financial" ON public.contabilidade FOR ALL 
USING (public.can_view_financial(auth.uid()));

-- 11. INCOME - Apenas financeiro
DROP POLICY IF EXISTS "Income viewable by financial" ON public.income;
DROP POLICY IF EXISTS "Income editable by financial" ON public.income;
DROP POLICY IF EXISTS "Anyone can view income" ON public.income;

CREATE POLICY "Income viewable by financial" ON public.income FOR SELECT 
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "Income editable by financial" ON public.income FOR ALL 
USING (public.can_view_financial(auth.uid()));

-- 12. SALES - Apenas admins
DROP POLICY IF EXISTS "Sales viewable by admins" ON public.sales;
DROP POLICY IF EXISTS "Sales editable by admins" ON public.sales;
DROP POLICY IF EXISTS "Anyone can view sales" ON public.sales;

CREATE POLICY "Sales viewable by admins" ON public.sales FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Sales editable by admins" ON public.sales FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 13. METRICAS_MARKETING - Apenas admins
DROP POLICY IF EXISTS "Marketing metrics viewable by admins" ON public.metricas_marketing;
DROP POLICY IF EXISTS "Marketing metrics editable by admins" ON public.metricas_marketing;
DROP POLICY IF EXISTS "Anyone can view metricas marketing" ON public.metricas_marketing;

CREATE POLICY "Marketing metrics viewable by admins" ON public.metricas_marketing FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Marketing metrics editable by admins" ON public.metricas_marketing FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 14. TIME_CLOCK_ENTRIES - Usuário vê seu próprio, admin vê todos
DROP POLICY IF EXISTS "Time clock viewable by user or admin" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Time clock editable by user or admin" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Anyone can view time clock" ON public.time_clock_entries;

CREATE POLICY "Time clock viewable by user or admin" ON public.time_clock_entries FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Time clock editable by user or admin" ON public.time_clock_entries FOR ALL 
USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

-- 15. PERSONAL_EXTRA_EXPENSES - Apenas próprio usuário
DROP POLICY IF EXISTS "Personal extra expenses viewable by owner" ON public.personal_extra_expenses;
DROP POLICY IF EXISTS "Personal extra expenses editable by owner" ON public.personal_extra_expenses;
DROP POLICY IF EXISTS "Anyone can view personal extra expenses" ON public.personal_extra_expenses;

CREATE POLICY "Personal extra expenses viewable by owner" ON public.personal_extra_expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Personal extra expenses editable by owner" ON public.personal_extra_expenses FOR ALL 
USING (auth.uid() = user_id);

-- 16. PERSONAL_FIXED_EXPENSES - Apenas próprio usuário
DROP POLICY IF EXISTS "Personal fixed expenses viewable by owner" ON public.personal_fixed_expenses;
DROP POLICY IF EXISTS "Personal fixed expenses editable by owner" ON public.personal_fixed_expenses;
DROP POLICY IF EXISTS "Anyone can view personal fixed expenses" ON public.personal_fixed_expenses;

CREATE POLICY "Personal fixed expenses viewable by owner" ON public.personal_fixed_expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Personal fixed expenses editable by owner" ON public.personal_fixed_expenses FOR ALL 
USING (auth.uid() = user_id);

-- 17. USER_MFA_SETTINGS - Apenas próprio usuário
DROP POLICY IF EXISTS "MFA settings viewable by owner" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "MFA settings editable by owner" ON public.user_mfa_settings;

CREATE POLICY "MFA settings viewable by owner" ON public.user_mfa_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "MFA settings editable by owner" ON public.user_mfa_settings FOR ALL 
USING (auth.uid() = user_id);

-- 18. WHATSAPP_CONVERSATIONS - Apenas admins
DROP POLICY IF EXISTS "WhatsApp conversations viewable by admins" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "WhatsApp conversations editable by admins" ON public.whatsapp_conversations;

CREATE POLICY "WhatsApp conversations viewable by admins" ON public.whatsapp_conversations FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "WhatsApp conversations editable by admins" ON public.whatsapp_conversations FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 19. COMMAND_TASKS - Apenas admins
DROP POLICY IF EXISTS "Command tasks viewable by admins" ON public.command_tasks;
DROP POLICY IF EXISTS "Command tasks editable by admins" ON public.command_tasks;

CREATE POLICY "Command tasks viewable by admins" ON public.command_tasks FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Command tasks editable by admins" ON public.command_tasks FOR ALL 
USING (public.is_admin_or_owner(auth.uid()));

-- 20. COMMAND_FINANCE - Apenas financeiro
DROP POLICY IF EXISTS "Command finance viewable by financial" ON public.command_finance;
DROP POLICY IF EXISTS "Command finance editable by financial" ON public.command_finance;

CREATE POLICY "Command finance viewable by financial" ON public.command_finance FOR SELECT 
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "Command finance editable by financial" ON public.command_finance FOR ALL 
USING (public.can_view_financial(auth.uid()));

-- 21. COMPANY_FIXED_EXPENSES - Apenas financeiro
DROP POLICY IF EXISTS "Company fixed expenses viewable by financial" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "Company fixed expenses editable by financial" ON public.company_fixed_expenses;

CREATE POLICY "Company fixed expenses viewable by financial" ON public.company_fixed_expenses FOR SELECT 
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "Company fixed expenses editable by financial" ON public.company_fixed_expenses FOR ALL 
USING (public.can_view_financial(auth.uid()));

-- 22. COMPANY_EXTRA_EXPENSES - Apenas financeiro
DROP POLICY IF EXISTS "Company extra expenses viewable by financial" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "Company extra expenses editable by financial" ON public.company_extra_expenses;

CREATE POLICY "Company extra expenses viewable by financial" ON public.company_extra_expenses FOR SELECT 
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "Company extra expenses editable by financial" ON public.company_extra_expenses FOR ALL 
USING (public.can_view_financial(auth.uid()));