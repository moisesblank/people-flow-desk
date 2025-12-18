
-- ==============================================
-- SECURITY HARDENING v17.0 - COMPREHENSIVE RLS FIX
-- Fixes all 13+ security vulnerabilities
-- ==============================================

-- 1. ALUNOS - Student data protection
DROP POLICY IF EXISTS "Alunos são visíveis para admins" ON public.alunos;
DROP POLICY IF EXISTS "Admins podem inserir alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins podem atualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins podem deletar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Anyone can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can insert alunos" ON public.alunos;

CREATE POLICY "alunos_select_admin" ON public.alunos FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "alunos_insert_admin" ON public.alunos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "alunos_update_admin" ON public.alunos FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "alunos_delete_admin" ON public.alunos FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 2. EMPLOYEES - Employee data protection
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;

CREATE POLICY "employees_select_admin" ON public.employees FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "employees_insert_admin" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "employees_update_admin" ON public.employees FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "employees_delete_admin" ON public.employees FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 3. AFFILIATES - Banking data protection (CRITICAL)
DROP POLICY IF EXISTS "Affiliates are viewable by admins" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can be managed by admins" ON public.affiliates;
DROP POLICY IF EXISTS "Anyone can view affiliates" ON public.affiliates;

CREATE POLICY "affiliates_select_admin" ON public.affiliates FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "affiliates_insert_admin" ON public.affiliates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "affiliates_update_admin" ON public.affiliates FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "affiliates_delete_admin" ON public.affiliates FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 4. TRANSACOES HOTMART COMPLETO - Payment data protection
DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "Authenticated users can manage transacoes" ON public.transacoes_hotmart_completo;

CREATE POLICY "transacoes_select_admin" ON public.transacoes_hotmart_completo FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "transacoes_insert_service" ON public.transacoes_hotmart_completo FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "transacoes_update_admin" ON public.transacoes_hotmart_completo FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 5. USUARIOS WORDPRESS SYNC
DROP POLICY IF EXISTS "Anyone can view usuarios_wordpress_sync" ON public.usuarios_wordpress_sync;

CREATE POLICY "wp_users_select_admin" ON public.usuarios_wordpress_sync FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "wp_users_insert_admin" ON public.usuarios_wordpress_sync FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "wp_users_update_admin" ON public.usuarios_wordpress_sync FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 6. WHATSAPP LEADS
DROP POLICY IF EXISTS "Anyone can view whatsapp_leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.whatsapp_leads;

CREATE POLICY "wa_leads_select_admin" ON public.whatsapp_leads FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "wa_leads_insert_service" ON public.whatsapp_leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "wa_leads_update_admin" ON public.whatsapp_leads FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 7. WHATSAPP MESSAGES
DROP POLICY IF EXISTS "Anyone can view whatsapp_messages" ON public.whatsapp_messages;

CREATE POLICY "wa_messages_select_admin" ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "wa_messages_insert_service" ON public.whatsapp_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 8. WOOCOMMERCE ORDERS
DROP POLICY IF EXISTS "Anyone can view woocommerce_orders" ON public.woocommerce_orders;

CREATE POLICY "woo_orders_select_admin" ON public.woocommerce_orders FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "woo_orders_insert_admin" ON public.woocommerce_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "woo_orders_update_admin" ON public.woocommerce_orders FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 9. ENTRADAS & GASTOS - Financial records
DROP POLICY IF EXISTS "Anyone can view entradas" ON public.entradas;
DROP POLICY IF EXISTS "Anyone can view gastos" ON public.gastos;

CREATE POLICY "entradas_select_financial" ON public.entradas FOR SELECT TO authenticated
  USING (public.can_view_financial(auth.uid()));
CREATE POLICY "entradas_insert_financial" ON public.entradas FOR INSERT TO authenticated
  WITH CHECK (public.can_view_financial(auth.uid()));
CREATE POLICY "entradas_update_financial" ON public.entradas FOR UPDATE TO authenticated
  USING (public.can_view_financial(auth.uid()));
CREATE POLICY "entradas_delete_financial" ON public.entradas FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "gastos_select_financial" ON public.gastos FOR SELECT TO authenticated
  USING (public.can_view_financial(auth.uid()));
CREATE POLICY "gastos_insert_financial" ON public.gastos FOR INSERT TO authenticated
  WITH CHECK (public.can_view_financial(auth.uid()));
CREATE POLICY "gastos_update_financial" ON public.gastos FOR UPDATE TO authenticated
  USING (public.can_view_financial(auth.uid()));
CREATE POLICY "gastos_delete_financial" ON public.gastos FOR DELETE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 10. EMPLOYEE COMPENSATION - Salary protection
DROP POLICY IF EXISTS "Owner can view compensation" ON public.employee_compensation;
DROP POLICY IF EXISTS "Anyone can view employee_compensation" ON public.employee_compensation;

CREATE POLICY "compensation_select_owner" ON public.employee_compensation FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()));
CREATE POLICY "compensation_insert_owner" ON public.employee_compensation FOR INSERT TO authenticated
  WITH CHECK (public.is_owner(auth.uid()));
CREATE POLICY "compensation_update_owner" ON public.employee_compensation FOR UPDATE TO authenticated
  USING (public.is_owner(auth.uid()));

-- 11. TIME CLOCK ENTRIES - Location protection
DROP POLICY IF EXISTS "Anyone can view time_clock_entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_entries_select_policy" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_entries_insert_policy" ON public.time_clock_entries;

CREATE POLICY "timeclock_select_policy" ON public.time_clock_entries FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY "timeclock_insert_policy" ON public.time_clock_entries FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()) OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "timeclock_update_admin" ON public.time_clock_entries FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 12. PAYMENTS
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;

CREATE POLICY "payments_select_financial" ON public.payments FOR SELECT TO authenticated
  USING (public.can_view_financial(auth.uid()));
CREATE POLICY "payments_insert_financial" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.can_view_financial(auth.uid()));
CREATE POLICY "payments_update_financial" ON public.payments FOR UPDATE TO authenticated
  USING (public.can_view_financial(auth.uid()));

-- 13. BANK ACCOUNTS
DROP POLICY IF EXISTS "Anyone can view bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_select_policy" ON public.bank_accounts;

CREATE POLICY "bank_select_admin" ON public.bank_accounts FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR (is_personal = true AND created_by = auth.uid()));
CREATE POLICY "bank_insert_admin" ON public.bank_accounts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()) OR is_personal = true);
CREATE POLICY "bank_update_admin" ON public.bank_accounts FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR (is_personal = true AND created_by = auth.uid()));

-- 14. AUDIT LOGS - Security logs protection
DROP POLICY IF EXISTS "Anyone can view audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anyone can view activity_log" ON public.activity_log;

CREATE POLICY "audit_logs_select_owner" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()));
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "activity_log_select_owner" ON public.activity_log FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "activity_log_insert_system" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- 15. WEBHOOKS QUEUE - API data protection
DROP POLICY IF EXISTS "Anyone can view webhooks_queue" ON public.webhooks_queue;

CREATE POLICY "webhooks_select_admin" ON public.webhooks_queue FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "webhooks_insert_service" ON public.webhooks_queue FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "webhooks_update_admin" ON public.webhooks_queue FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 16. USER SESSIONS - Session protection
DROP POLICY IF EXISTS "Anyone can view user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_select_policy" ON public.user_sessions;

CREATE POLICY "sessions_select_own" ON public.user_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_owner(auth.uid()));
CREATE POLICY "sessions_insert_own" ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_update_own" ON public.user_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

-- 17. GENERAL DOCUMENTS
DROP POLICY IF EXISTS "Anyone can view general_documents" ON public.general_documents;

CREATE POLICY "docs_select_admin" ON public.general_documents FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "docs_insert_admin" ON public.general_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "docs_update_admin" ON public.general_documents FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 18. MARKETING METRICS TABLES
DROP POLICY IF EXISTS "Anyone can view facebook_ads_metrics" ON public.facebook_ads_metrics;
DROP POLICY IF EXISTS "Anyone can view google_analytics_metrics" ON public.google_analytics_metrics;
DROP POLICY IF EXISTS "Anyone can view marketing_campaigns" ON public.marketing_campaigns;

CREATE POLICY "fb_ads_select_admin" ON public.facebook_ads_metrics FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "fb_ads_insert_admin" ON public.facebook_ads_metrics FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "ga_metrics_select_admin" ON public.google_analytics_metrics FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "ga_metrics_insert_admin" ON public.google_analytics_metrics FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "marketing_select_admin" ON public.marketing_campaigns FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "marketing_insert_admin" ON public.marketing_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "marketing_update_admin" ON public.marketing_campaigns FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- 19. FIX FUNCTION SEARCH PATH - Update update_updated_at_tramon
CREATE OR REPLACE FUNCTION public.update_updated_at_tramon()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 20. ADMIN AUDIT LOG protection
DROP POLICY IF EXISTS "Anyone can view admin_audit_log" ON public.admin_audit_log;

CREATE POLICY "admin_audit_select_owner" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()));
CREATE POLICY "admin_audit_insert_system" ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Add security log for this migration
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES ('SECURITY_MIGRATION_V17', 'multiple', jsonb_build_object(
  'executed_at', NOW(),
  'version', 'v17.0',
  'fixes', ARRAY[
    'alunos_rls',
    'employees_rls', 
    'affiliates_rls',
    'transacoes_hotmart_rls',
    'usuarios_wordpress_rls',
    'whatsapp_leads_rls',
    'whatsapp_messages_rls',
    'woocommerce_orders_rls',
    'entradas_gastos_rls',
    'employee_compensation_rls',
    'time_clock_entries_rls',
    'payments_rls',
    'bank_accounts_rls',
    'audit_logs_rls',
    'webhooks_queue_rls',
    'user_sessions_rls',
    'general_documents_rls',
    'marketing_metrics_rls',
    'function_search_path_fix'
  ]
));
