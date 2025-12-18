-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA - RLS POLICIES
-- =====================================================

-- 1. PROFILES - Restringir acesso a próprio perfil ou admin
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ALUNOS - Apenas admin/coordenacao pode ver
DROP POLICY IF EXISTS "alunos_select_admin" ON public.alunos;
DROP POLICY IF EXISTS "alunos_insert_admin" ON public.alunos;
DROP POLICY IF EXISTS "alunos_update_admin" ON public.alunos;
DROP POLICY IF EXISTS "alunos_delete_admin" ON public.alunos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.alunos;

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alunos_select_admin" ON public.alunos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

CREATE POLICY "alunos_insert_admin" ON public.alunos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

CREATE POLICY "alunos_update_admin" ON public.alunos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

CREATE POLICY "alunos_delete_admin" ON public.alunos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 3. AFFILIATES - Afiliado vê só o dele, admin vê todos
DROP POLICY IF EXISTS "affiliates_select" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_insert_admin" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_update" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_delete_admin" ON public.affiliates;

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_select" ON public.affiliates
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "affiliates_insert_admin" ON public.affiliates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "affiliates_update" ON public.affiliates
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "affiliates_delete_admin" ON public.affiliates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 4. EMPLOYEES - Funcionário vê só o dele, admin vê todos
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_admin" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select" ON public.employees
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

CREATE POLICY "employees_insert_admin" ON public.employees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "employees_update" ON public.employees
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 5. TRANSACOES_HOTMART_COMPLETO - Apenas admin/contabilidade
DROP POLICY IF EXISTS "transacoes_hotmart_select_admin" ON public.transacoes_hotmart_completo;

ALTER TABLE public.transacoes_hotmart_completo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transacoes_hotmart_select_admin" ON public.transacoes_hotmart_completo
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'contabilidade'))
  );

CREATE POLICY "transacoes_hotmart_insert_system" ON public.transacoes_hotmart_completo
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 6. WOOCOMMERCE_ORDERS - Apenas admin
DROP POLICY IF EXISTS "woocommerce_orders_select_admin" ON public.woocommerce_orders;

ALTER TABLE public.woocommerce_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "woocommerce_orders_select_admin" ON public.woocommerce_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 7. USUARIOS_WORDPRESS_SYNC - Apenas admin
DROP POLICY IF EXISTS "wordpress_sync_select_admin" ON public.usuarios_wordpress_sync;

ALTER TABLE public.usuarios_wordpress_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wordpress_sync_select_admin" ON public.usuarios_wordpress_sync
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "wordpress_sync_all_admin" ON public.usuarios_wordpress_sync
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 8. WHATSAPP_LEADS - Apenas admin/suporte
DROP POLICY IF EXISTS "whatsapp_leads_select" ON public.whatsapp_leads;

ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_leads_select" ON public.whatsapp_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'suporte'))
  );

CREATE POLICY "whatsapp_leads_all" ON public.whatsapp_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'suporte'))
  );

-- 9. WHATSAPP_CONVERSATIONS - Apenas admin/suporte
DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_conversations_select" ON public.whatsapp_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'suporte'))
  );

CREATE POLICY "whatsapp_conversations_all" ON public.whatsapp_conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'suporte'))
  );

-- 10. WHATSAPP_MESSAGES - Apenas admin/suporte
DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_select" ON public.whatsapp_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'suporte'))
  );

CREATE POLICY "whatsapp_messages_all" ON public.whatsapp_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'suporte'))
  );

-- 11. EMPLOYEE_COMPENSATION - APENAS OWNER
DROP POLICY IF EXISTS "employee_compensation_select_owner" ON public.employee_compensation;

ALTER TABLE public.employee_compensation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_compensation_select_owner" ON public.employee_compensation
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "employee_compensation_all_owner" ON public.employee_compensation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'owner')
  );

-- 12. TIME_CLOCK_ENTRIES - Funcionário vê só o dele, admin vê todos
DROP POLICY IF EXISTS "time_clock_select" ON public.time_clock_entries;

ALTER TABLE public.time_clock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_clock_select" ON public.time_clock_entries
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "time_clock_insert_own" ON public.time_clock_entries
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "time_clock_update_admin" ON public.time_clock_entries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 13. TWO_FACTOR_CODES - APENAS PRÓPRIO USUÁRIO
DROP POLICY IF EXISTS "two_factor_codes_select_own" ON public.two_factor_codes;

ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "two_factor_codes_select_own" ON public.two_factor_codes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "two_factor_codes_insert_own" ON public.two_factor_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "two_factor_codes_delete_own" ON public.two_factor_codes
  FOR DELETE USING (user_id = auth.uid());

-- 14. USER_MFA_SETTINGS - APENAS PRÓPRIO USUÁRIO
DROP POLICY IF EXISTS "user_mfa_settings_select_own" ON public.user_mfa_settings;

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_mfa_settings_select_own" ON public.user_mfa_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_mfa_settings_insert_own" ON public.user_mfa_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_mfa_settings_update_own" ON public.user_mfa_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_mfa_settings_delete_own" ON public.user_mfa_settings
  FOR DELETE USING (user_id = auth.uid());

-- Log de auditoria de segurança usando a coluna correta "payload"
INSERT INTO security_events (event_type, payload, severity, source, description)
VALUES (
  'RLS_POLICIES_UPDATED',
  jsonb_build_object(
    'tables_secured', ARRAY[
      'profiles', 'alunos', 'affiliates', 'employees', 
      'transacoes_hotmart_completo', 'woocommerce_orders', 
      'usuarios_wordpress_sync', 'whatsapp_leads', 
      'whatsapp_conversations', 'whatsapp_messages',
      'employee_compensation', 'time_clock_entries',
      'two_factor_codes', 'user_mfa_settings'
    ],
    'vulnerabilities_fixed', 14,
    'timestamp', now()
  ),
  'critical',
  'security_audit',
  '14 tabelas tiveram políticas RLS corrigidas para proteger dados sensíveis'
);