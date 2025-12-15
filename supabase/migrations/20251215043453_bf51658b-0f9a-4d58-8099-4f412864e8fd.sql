-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Políticas RLS para AUTHENTICATED apenas
-- Remove acesso anônimo de todas as tabelas
-- =====================================================

-- 1. AFFILIATES
DROP POLICY IF EXISTS "Admin manages affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates select admin only" ON public.affiliates;
CREATE POLICY "Admin manages affiliates" ON public.affiliates FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 2. ARQUIVOS
DROP POLICY IF EXISTS "Admin manages arquivos" ON public.arquivos;
DROP POLICY IF EXISTS "Arquivos select admin only" ON public.arquivos;
CREATE POLICY "Admin manages arquivos" ON public.arquivos FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 3. AUDIT_LOGS
DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Owner can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 4. CALENDAR_TASKS
DROP POLICY IF EXISTS "Calendar tasks select own or admin" ON public.calendar_tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.calendar_tasks;
CREATE POLICY "Users can manage own tasks" ON public.calendar_tasks FOR ALL TO authenticated USING ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid()));

-- 5. COMPANY_EXTRA_EXPENSES
DROP POLICY IF EXISTS "Admin manages company extra expenses" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "Company extra expenses select admin only" ON public.company_extra_expenses;
CREATE POLICY "Admin manages company extra expenses" ON public.company_extra_expenses FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 6. COMPANY_FIXED_EXPENSES
DROP POLICY IF EXISTS "Admin manages company fixed expenses" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "Company fixed expenses select admin only" ON public.company_fixed_expenses;
CREATE POLICY "Admin manages company fixed expenses" ON public.company_fixed_expenses FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 7. CONTABILIDADE
DROP POLICY IF EXISTS "Admin manages contabilidade" ON public.contabilidade;
DROP POLICY IF EXISTS "Contabilidade select admin only" ON public.contabilidade;
CREATE POLICY "Admin manages contabilidade" ON public.contabilidade FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 8. EMPLOYEES
DROP POLICY IF EXISTS "Admin can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view themselves" ON public.employees;
DROP POLICY IF EXISTS "Employees select admin full access" ON public.employees;
DROP POLICY IF EXISTS "Employees view own record without salary access" ON public.employees;
CREATE POLICY "Admin can manage employees" ON public.employees FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Employees can view themselves" ON public.employees FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 9. FINANCIAL_GOALS
DROP POLICY IF EXISTS "Users can create their own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.financial_goals;
CREATE POLICY "Users can manage their own goals" ON public.financial_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. GOAL_PROGRESS_HISTORY
DROP POLICY IF EXISTS "Users can add to their goal history" ON public.goal_progress_history;
DROP POLICY IF EXISTS "Users can delete their goal history" ON public.goal_progress_history;
DROP POLICY IF EXISTS "Users can view their goal history" ON public.goal_progress_history;
CREATE POLICY "Users can manage their goal history" ON public.goal_progress_history FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM financial_goals WHERE financial_goals.id = goal_progress_history.goal_id AND financial_goals.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM financial_goals WHERE financial_goals.id = goal_progress_history.goal_id AND financial_goals.user_id = auth.uid()));

-- 11. INCOME
DROP POLICY IF EXISTS "Admin manages income" ON public.income;
DROP POLICY IF EXISTS "Income select admin only" ON public.income;
CREATE POLICY "Admin manages income" ON public.income FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 12. INTEGRATION_EVENTS
DROP POLICY IF EXISTS "Admin manages integration events" ON public.integration_events;
CREATE POLICY "Admin manages integration events" ON public.integration_events FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 13. METRICAS_MARKETING
DROP POLICY IF EXISTS "Admin manages metricas" ON public.metricas_marketing;
DROP POLICY IF EXISTS "Metricas marketing select admin only" ON public.metricas_marketing;
CREATE POLICY "Admin manages metricas" ON public.metricas_marketing FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 14. PAYMENTS
DROP POLICY IF EXISTS "Admin manages payments" ON public.payments;
DROP POLICY IF EXISTS "Payments select admin only" ON public.payments;
CREATE POLICY "Admin manages payments" ON public.payments FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 15. PERMISSION_AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can insert permission audit logs" ON public.permission_audit_logs;
DROP POLICY IF EXISTS "Owners can view permission audit logs" ON public.permission_audit_logs;
CREATE POLICY "Owners can view permission audit logs" ON public.permission_audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Admins can insert permission audit logs" ON public.permission_audit_logs FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner(auth.uid()));

-- 16. PERSONAL_EXTRA_EXPENSES
DROP POLICY IF EXISTS "Users manage own extra expenses" ON public.personal_extra_expenses;
CREATE POLICY "Users manage own extra expenses" ON public.personal_extra_expenses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 17. PERSONAL_FIXED_EXPENSES
DROP POLICY IF EXISTS "Users manage own fixed expenses" ON public.personal_fixed_expenses;
CREATE POLICY "Users manage own fixed expenses" ON public.personal_fixed_expenses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 18. PROFESSOR_CHECKLISTS
DROP POLICY IF EXISTS "Admin manages professor checklists" ON public.professor_checklists;
DROP POLICY IF EXISTS "Professor checklists select admin only" ON public.professor_checklists;
CREATE POLICY "Admin manages professor checklists" ON public.professor_checklists FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 19. PROFILES
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Owner can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 20. SALES
DROP POLICY IF EXISTS "Admin manages sales" ON public.sales;
DROP POLICY IF EXISTS "Sales select admin only" ON public.sales;
CREATE POLICY "Admin manages sales" ON public.sales FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 21. STUDENTS
DROP POLICY IF EXISTS "Admin manages students" ON public.students;
DROP POLICY IF EXISTS "Students select admin only" ON public.students;
CREATE POLICY "Admin manages students" ON public.students FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 22. SYNAPSE_INTEGRATIONS
DROP POLICY IF EXISTS "Admin manages synapse integrations" ON public.synapse_integrations;
DROP POLICY IF EXISTS "Synapse integrations select admin" ON public.synapse_integrations;
CREATE POLICY "Admin manages integrations" ON public.synapse_integrations FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 23. SYNAPSE_METRICS
DROP POLICY IF EXISTS "Admin manages synapse metrics" ON public.synapse_metrics;
DROP POLICY IF EXISTS "Synapse metrics select admin" ON public.synapse_metrics;
CREATE POLICY "Admin manages metrics" ON public.synapse_metrics FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 24. SYNAPSE_TRANSACTIONS
DROP POLICY IF EXISTS "Admin manages synapse transactions" ON public.synapse_transactions;
DROP POLICY IF EXISTS "Synapse transactions select admin" ON public.synapse_transactions;
CREATE POLICY "Admin manages transactions" ON public.synapse_transactions FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 25. TAXES
DROP POLICY IF EXISTS "Admin manages taxes" ON public.taxes;
DROP POLICY IF EXISTS "Taxes select admin only" ON public.taxes;
CREATE POLICY "Admin manages taxes" ON public.taxes FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- 26. USER_ROLES
DROP POLICY IF EXISTS "Owner can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Owner can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 27. WEBHOOK_RATE_LIMITS - Mantém acesso público para webhooks funcionarem
-- (já está correto para webhooks externos)

-- 28. WEBSITE_PENDENCIAS
DROP POLICY IF EXISTS "Admin manages website pendencias" ON public.website_pendencias;
DROP POLICY IF EXISTS "Website pendencias select admin only" ON public.website_pendencias;
CREATE POLICY "Admin manages website pendencias" ON public.website_pendencias FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- NOVAS TABELAS: Analytics, Configurações e Regras
-- =====================================================

-- TABELA: ANALYTICS_METRICS (Métricas de Performance)
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type text NOT NULL DEFAULT 'pageview',
  page_path text,
  visitor_id text,
  session_id text,
  user_agent text,
  referrer text,
  country text,
  device_type text,
  browser text,
  duration_ms integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON public.analytics_metrics (metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_created ON public.analytics_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_path ON public.analytics_metrics (page_path);

ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages analytics" ON public.analytics_metrics FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Public insert analytics" ON public.analytics_metrics FOR INSERT WITH CHECK (true);

-- TABELA: SYSTEM_SETTINGS (Configurações do Sistema)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  setting_type text NOT NULL DEFAULT 'general',
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON public.system_settings (setting_type);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages settings" ON public.system_settings FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Public can view public settings" ON public.system_settings FOR SELECT USING (is_public = true);

-- Trigger para updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- TABELA: CUSTOM_RULES (Regras Personalizadas)
CREATE TABLE IF NOT EXISTS public.custom_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'automation',
  trigger_event text,
  conditions jsonb DEFAULT '[]'::jsonb,
  actions jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_rules_type ON public.custom_rules (rule_type);
CREATE INDEX IF NOT EXISTS idx_custom_rules_active ON public.custom_rules (is_active);

ALTER TABLE public.custom_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages rules" ON public.custom_rules FOR ALL TO authenticated USING (is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_custom_rules_updated_at
  BEFORE UPDATE ON public.custom_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CONFIGURAÇÕES PADRÃO DO SISTEMA
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES 
  ('site_name', '"Curso - Moisés Medeiros"', 'branding', 'Nome do site', true),
  ('site_description', '"Plataforma de gestão educacional"', 'branding', 'Descrição do site', true),
  ('theme', '{"mode": "dark", "primaryColor": "wine", "accentColor": "blue"}', 'appearance', 'Tema visual', true),
  ('analytics_enabled', 'true', 'features', 'Analytics ativado', false),
  ('backup_enabled', 'true', 'features', 'Backup automático', false),
  ('notification_settings', '{"email": true, "push": false, "sms": false}', 'notifications', 'Configurações de notificação', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;