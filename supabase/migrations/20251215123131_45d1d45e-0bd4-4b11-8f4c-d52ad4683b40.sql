-- ============================================
-- MOISÉS MEDEIROS v5.0 - SECURITY HARDENING
-- Correção de políticas RLS para autenticação
-- Adição de buckets de storage
-- ============================================

-- 1. CORRIGIR POLÍTICAS RLS PARA EXIGIR AUTENTICAÇÃO
-- Remover políticas antigas e criar novas com 'TO authenticated'

-- affiliates
DROP POLICY IF EXISTS "Owner/Admin manages affiliates" ON public.affiliates;
CREATE POLICY "Owner/Admin manages affiliates" 
ON public.affiliates 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- analytics_metrics
DROP POLICY IF EXISTS "Owner/Admin manages analytics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Public insert analytics" ON public.analytics_metrics;
CREATE POLICY "Owner/Admin manages analytics" 
ON public.analytics_metrics 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Anyone can insert analytics" 
ON public.analytics_metrics 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- arquivos
DROP POLICY IF EXISTS "Admin manages arquivos" ON public.arquivos;
CREATE POLICY "Admin manages arquivos" 
ON public.arquivos 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- audit_logs
DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Owner can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- badges
DROP POLICY IF EXISTS "Admin gerencia badges" ON public.badges;
DROP POLICY IF EXISTS "Badges são públicos" ON public.badges;
CREATE POLICY "Admin gerencia badges" 
ON public.badges 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Badges são públicos" 
ON public.badges 
FOR SELECT 
TO authenticated 
USING (true);

-- calendar_tasks
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.calendar_tasks;
CREATE POLICY "Users can manage own tasks" 
ON public.calendar_tasks 
FOR ALL 
TO authenticated 
USING ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid())) 
WITH CHECK ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid()));

-- company_extra_expenses
DROP POLICY IF EXISTS "Owner/Admin manages company extra expenses" ON public.company_extra_expenses;
CREATE POLICY "Owner/Admin manages company extra expenses" 
ON public.company_extra_expenses 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- company_fixed_expenses
DROP POLICY IF EXISTS "Owner/Admin manages company fixed expenses" ON public.company_fixed_expenses;
CREATE POLICY "Owner/Admin manages company fixed expenses" 
ON public.company_fixed_expenses 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- contabilidade
DROP POLICY IF EXISTS "Owner/Admin manages contabilidade" ON public.contabilidade;
CREATE POLICY "Owner/Admin manages contabilidade" 
ON public.contabilidade 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- courses
DROP POLICY IF EXISTS "Admin gerencia cursos" ON public.courses;
DROP POLICY IF EXISTS "Cursos publicados são públicos" ON public.courses;
CREATE POLICY "Admin gerencia cursos" 
ON public.courses 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Cursos publicados são públicos" 
ON public.courses 
FOR SELECT 
TO authenticated 
USING (is_published = true);

-- custom_rules
DROP POLICY IF EXISTS "Owner/Admin manages custom rules" ON public.custom_rules;
CREATE POLICY "Owner/Admin manages custom rules" 
ON public.custom_rules 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- employees
DROP POLICY IF EXISTS "Employees can view themselves" ON public.employees;
DROP POLICY IF EXISTS "Owner/Admin can manage employees" ON public.employees;
CREATE POLICY "Employees can view themselves" 
ON public.employees 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Owner/Admin can manage employees" 
ON public.employees 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- enrollments
DROP POLICY IF EXISTS "Admin gerencia matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Usuário pode se matricular" ON public.enrollments;
DROP POLICY IF EXISTS "Usuário vê próprias matrículas" ON public.enrollments;
CREATE POLICY "Admin gerencia matrículas" 
ON public.enrollments 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário pode se matricular" 
ON public.enrollments 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário vê próprias matrículas" 
ON public.enrollments 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- financial_goals
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.financial_goals;
CREATE POLICY "Users can manage their own goals" 
ON public.financial_goals 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- goal_progress_history
DROP POLICY IF EXISTS "Users can manage their goal history" ON public.goal_progress_history;
CREATE POLICY "Users can manage their goal history" 
ON public.goal_progress_history 
FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM financial_goals WHERE financial_goals.id = goal_progress_history.goal_id AND financial_goals.user_id = auth.uid())) 
WITH CHECK (EXISTS (SELECT 1 FROM financial_goals WHERE financial_goals.id = goal_progress_history.goal_id AND financial_goals.user_id = auth.uid()));

-- income
DROP POLICY IF EXISTS "Owner/Admin manages income" ON public.income;
CREATE POLICY "Owner/Admin manages income" 
ON public.income 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- integration_events
DROP POLICY IF EXISTS "Admin manages integration events" ON public.integration_events;
CREATE POLICY "Admin manages integration events" 
ON public.integration_events 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- lesson_progress
DROP POLICY IF EXISTS "Admin vê progresso" ON public.lesson_progress;
DROP POLICY IF EXISTS "Usuário gerencia próprio progresso" ON public.lesson_progress;
CREATE POLICY "Admin vê progresso" 
ON public.lesson_progress 
FOR SELECT 
TO authenticated 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário gerencia próprio progresso" 
ON public.lesson_progress 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- lessons
DROP POLICY IF EXISTS "Admin gerencia aulas" ON public.lessons;
DROP POLICY IF EXISTS "Aulas gratuitas são públicas" ON public.lessons;
CREATE POLICY "Admin gerencia aulas" 
ON public.lessons 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Aulas gratuitas são públicas" 
ON public.lessons 
FOR SELECT 
TO authenticated 
USING ((is_free = true) OR (EXISTS (SELECT 1 FROM enrollments e JOIN modules m ON m.course_id = e.course_id WHERE m.id = lessons.module_id AND e.user_id = auth.uid() AND e.status = 'active')));

-- metricas_marketing
DROP POLICY IF EXISTS "Admin manages metricas" ON public.metricas_marketing;
DROP POLICY IF EXISTS "Owner/Admin manages marketing metrics" ON public.metricas_marketing;
CREATE POLICY "Owner/Admin manages marketing metrics" 
ON public.metricas_marketing 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- modules
DROP POLICY IF EXISTS "Admin gerencia módulos" ON public.modules;
DROP POLICY IF EXISTS "Módulos de cursos publicados são públicos" ON public.modules;
CREATE POLICY "Admin gerencia módulos" 
ON public.modules 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Módulos de cursos publicados são públicos" 
ON public.modules 
FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.is_published = true));

-- notifications
DROP POLICY IF EXISTS "System can insert notifications for any user" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can manage own notifications" 
ON public.notifications 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- payment_transactions
DROP POLICY IF EXISTS "Admin gerencia transações" ON public.payment_transactions;
DROP POLICY IF EXISTS "Usuário vê próprias transações" ON public.payment_transactions;
CREATE POLICY "Admin gerencia transações" 
ON public.payment_transactions 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário vê próprias transações" 
ON public.payment_transactions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- payments
DROP POLICY IF EXISTS "Admin manages payments" ON public.payments;
CREATE POLICY "Admin manages payments" 
ON public.payments 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- permission_audit_logs
DROP POLICY IF EXISTS "Admins can insert permission audit logs" ON public.permission_audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.permission_audit_logs;
DROP POLICY IF EXISTS "Owner views permission audit logs" ON public.permission_audit_logs;
DROP POLICY IF EXISTS "Owners can view permission audit logs" ON public.permission_audit_logs;
CREATE POLICY "Admins can insert permission audit logs" 
ON public.permission_audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner views permission audit logs" 
ON public.permission_audit_logs 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'owner'::app_role));

-- personal_extra_expenses
DROP POLICY IF EXISTS "Users manage own extra expenses" ON public.personal_extra_expenses;
CREATE POLICY "Users manage own extra expenses" 
ON public.personal_extra_expenses 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- personal_fixed_expenses
DROP POLICY IF EXISTS "Users manage own fixed expenses" ON public.personal_fixed_expenses;
CREATE POLICY "Users manage own fixed expenses" 
ON public.personal_fixed_expenses 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- professor_checklists
DROP POLICY IF EXISTS "Admin manages professor checklists" ON public.professor_checklists;
CREATE POLICY "Admin manages professor checklists" 
ON public.professor_checklists 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Owner can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- sales
DROP POLICY IF EXISTS "Owner/Admin manages sales" ON public.sales;
CREATE POLICY "Owner/Admin manages sales" 
ON public.sales 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- students
DROP POLICY IF EXISTS "Owner/Admin manages students" ON public.students;
CREATE POLICY "Owner/Admin manages students" 
ON public.students 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- subscriptions
DROP POLICY IF EXISTS "Admin gerencia assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuário vê própria assinatura" ON public.subscriptions;
CREATE POLICY "Admin gerencia assinaturas" 
ON public.subscriptions 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário vê própria assinatura" 
ON public.subscriptions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- synapse_integrations
DROP POLICY IF EXISTS "Admin manages integrations" ON public.synapse_integrations;
DROP POLICY IF EXISTS "Owner/Admin manages integrations" ON public.synapse_integrations;
CREATE POLICY "Owner/Admin manages integrations" 
ON public.synapse_integrations 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- synapse_metrics
DROP POLICY IF EXISTS "Admin manages metrics" ON public.synapse_metrics;
CREATE POLICY "Admin manages metrics" 
ON public.synapse_metrics 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- synapse_transactions
DROP POLICY IF EXISTS "Admin manages transactions" ON public.synapse_transactions;
CREATE POLICY "Admin manages transactions" 
ON public.synapse_transactions 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- system_settings
DROP POLICY IF EXISTS "Owner manages system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public can view public settings" ON public.system_settings;
CREATE POLICY "Owner manages system settings" 
ON public.system_settings 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'owner'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Public can view public settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated 
USING (is_public = true);

-- taxes
DROP POLICY IF EXISTS "Owner/Admin manages taxes" ON public.taxes;
CREATE POLICY "Owner/Admin manages taxes" 
ON public.taxes 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- time_clock_absences
DROP POLICY IF EXISTS "Admin gerencia ausências" ON public.time_clock_absences;
DROP POLICY IF EXISTS "Funcionário gerencia próprias ausências" ON public.time_clock_absences;
CREATE POLICY "Admin gerencia ausências" 
ON public.time_clock_absences 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário gerencia próprias ausências" 
ON public.time_clock_absences 
FOR ALL 
TO authenticated 
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())) 
WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- time_clock_entries
DROP POLICY IF EXISTS "Admin gerencia pontos" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Funcionário registra próprio ponto" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Funcionário vê próprios pontos" ON public.time_clock_entries;
CREATE POLICY "Admin gerencia pontos" 
ON public.time_clock_entries 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário registra próprio ponto" 
ON public.time_clock_entries 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Funcionário vê próprios pontos" 
ON public.time_clock_entries 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- time_clock_reports
DROP POLICY IF EXISTS "Admin gerencia relatórios ponto" ON public.time_clock_reports;
DROP POLICY IF EXISTS "Funcionário vê próprios relatórios" ON public.time_clock_reports;
CREATE POLICY "Admin gerencia relatórios ponto" 
ON public.time_clock_reports 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário vê próprios relatórios" 
ON public.time_clock_reports 
FOR SELECT 
TO authenticated 
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- time_clock_settings
DROP POLICY IF EXISTS "Admin gerencia configurações ponto" ON public.time_clock_settings;
DROP POLICY IF EXISTS "Funcionário vê próprias configurações" ON public.time_clock_settings;
CREATE POLICY "Admin gerencia configurações ponto" 
ON public.time_clock_settings 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário vê próprias configurações" 
ON public.time_clock_settings 
FOR SELECT 
TO authenticated 
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- user_badges
DROP POLICY IF EXISTS "Admin gerencia user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Usuário vê próprios badges" ON public.user_badges;
CREATE POLICY "Admin gerencia user_badges" 
ON public.user_badges 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário gerencia próprios badges" 
ON public.user_badges 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- user_gamification
DROP POLICY IF EXISTS "Admin gerencia gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Usuário gerencia própria gamification" ON public.user_gamification;
CREATE POLICY "Admin gerencia gamification" 
ON public.user_gamification 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário gerencia própria gamification" 
ON public.user_gamification 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- user_mfa_settings
DROP POLICY IF EXISTS "Users manage own MFA" ON public.user_mfa_settings;
CREATE POLICY "Users manage own MFA" 
ON public.user_mfa_settings 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Owner manages user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Owner manages user_roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'owner'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- webhook_rate_limits
DROP POLICY IF EXISTS "Admin manages rate limits" ON public.webhook_rate_limits;
CREATE POLICY "Admin manages rate limits" 
ON public.webhook_rate_limits 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- website_pendencias
DROP POLICY IF EXISTS "Admin manages pendencias" ON public.website_pendencias;
CREATE POLICY "Admin manages pendencias" 
ON public.website_pendencias 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- whatsapp_notifications
DROP POLICY IF EXISTS "Admin manages whatsapp notifications" ON public.whatsapp_notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON public.whatsapp_notifications;
CREATE POLICY "Admin manages whatsapp notifications" 
ON public.whatsapp_notifications 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Users view own notifications" 
ON public.whatsapp_notifications 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- whatsapp_templates
DROP POLICY IF EXISTS "Admin manages templates" ON public.whatsapp_templates;
CREATE POLICY "Admin manages templates" 
ON public.whatsapp_templates 
FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- xp_history
DROP POLICY IF EXISTS "Admin vê histórico XP" ON public.xp_history;
DROP POLICY IF EXISTS "Usuário vê próprio histórico XP" ON public.xp_history;
CREATE POLICY "Admin vê histórico XP" 
ON public.xp_history 
FOR SELECT 
TO authenticated 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário vê próprio histórico XP" 
ON public.xp_history 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 2. CRIAR NOVOS BUCKETS DE STORAGE

-- Bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para certificados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificados', 'certificados', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para comprovantes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para mídia de aulas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('aulas', 'aulas', false)
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE STORAGE

-- Políticas para avatars (público)
CREATE POLICY "Avatares são públicos" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de avatar" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar próprio avatar" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar próprio avatar" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para certificados
CREATE POLICY "Usuários veem próprios certificados" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'certificados' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admin gerencia certificados" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'certificados' AND is_admin_or_owner(auth.uid()));

-- Políticas para comprovantes
CREATE POLICY "Usuários veem próprios comprovantes" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem fazer upload de comprovantes" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admin gerencia comprovantes" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'comprovantes' AND is_admin_or_owner(auth.uid()));

-- Políticas para aulas
CREATE POLICY "Alunos matriculados veem aulas" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'aulas');

CREATE POLICY "Admin gerencia aulas storage" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'aulas' AND is_admin_or_owner(auth.uid()));

-- Políticas para documentos (bucket existente)
CREATE POLICY "Admin gerencia documentos" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'documentos' AND is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuários veem próprios documentos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user_id ON public.calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date ON public.calendar_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_synapse_transactions_created_at ON public.synapse_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_synapse_transactions_status ON public.synapse_transactions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_created_at ON public.permission_audit_logs(created_at);