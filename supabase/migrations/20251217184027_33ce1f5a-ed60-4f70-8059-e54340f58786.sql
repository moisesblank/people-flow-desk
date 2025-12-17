
-- ============================================
-- MEGA CORREÇÃO DE SEGURANÇA v4.1 - CORRIGIDA
-- ============================================

-- ============================================
-- 1. PROFILES: Consolidar políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles with logging" ON public.profiles;
DROP POLICY IF EXISTS "Owner can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles with audit" ON public.profiles;
DROP POLICY IF EXISTS "Users delete own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users view only own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_v3" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_v3" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_v3" ON public.profiles;

CREATE POLICY "profiles_secure_select_v4" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "profiles_secure_insert_v4" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_secure_update_v4" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_owner_update_v4" ON public.profiles
  FOR UPDATE USING (is_owner(auth.uid()));

CREATE POLICY "profiles_secure_delete_v4" ON public.profiles
  FOR DELETE USING (id = auth.uid());

-- ============================================
-- 2. EMPLOYEE_COMPENSATION: Garantir owner-only
-- ============================================
DROP POLICY IF EXISTS "Only owner can manage salaries" ON public.employee_compensation;
DROP POLICY IF EXISTS "Only owner can view salaries" ON public.employee_compensation;
DROP POLICY IF EXISTS "Owner only compensation access" ON public.employee_compensation;

CREATE POLICY "compensation_owner_only_v4" ON public.employee_compensation
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

-- ============================================
-- 3. AFFILIATES: Consolidar e proteger dados bancários
-- ============================================
DROP POLICY IF EXISTS "Admins can update affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can view all affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view own data" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates editable by admins" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates viewable by admins" ON public.affiliates;
DROP POLICY IF EXISTS "v16_affiliates_delete" ON public.affiliates;
DROP POLICY IF EXISTS "v16_affiliates_insert" ON public.affiliates;
DROP POLICY IF EXISTS "v16_affiliates_select" ON public.affiliates;
DROP POLICY IF EXISTS "v16_affiliates_update" ON public.affiliates;

CREATE POLICY "affiliates_admin_manage_v4" ON public.affiliates
  FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "affiliates_own_data_v4" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 4. ALUNOS: Consolidar políticas
-- ============================================
DROP POLICY IF EXISTS "Admins can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Service can insert alunos" ON public.alunos;
DROP POLICY IF EXISTS "Students can view own data" ON public.alunos;
DROP POLICY IF EXISTS "v16_alunos_delete" ON public.alunos;
DROP POLICY IF EXISTS "v16_alunos_insert" ON public.alunos;
DROP POLICY IF EXISTS "v16_alunos_select" ON public.alunos;
DROP POLICY IF EXISTS "v16_alunos_update" ON public.alunos;

CREATE POLICY "alunos_admin_manage_v4" ON public.alunos
  FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "alunos_own_data_v4" ON public.alunos
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================
-- 5. WHATSAPP_LEADS: Restringir service inserts
-- ============================================
DROP POLICY IF EXISTS "Leads editáveis por owner e admin" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Leads visíveis para owner e admin" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Only sales and admins can view leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Service inserts whatsapp_leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Service role pode atualizar leads" ON public.whatsapp_leads;

CREATE POLICY "leads_admin_manage_v4" ON public.whatsapp_leads
  FOR ALL USING (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'marketing')) 
  WITH CHECK (is_admin_or_owner(auth.uid()));

-- ============================================
-- 6. TWO_FACTOR_CODES: Segurança melhorada
-- ============================================
DROP POLICY IF EXISTS "2fa_select_v32" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_update_v32" ON public.two_factor_codes;
DROP POLICY IF EXISTS "Users can update own 2FA codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "Users can view own 2FA codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "v16_2fa_delete" ON public.two_factor_codes;
DROP POLICY IF EXISTS "v16_2fa_insert" ON public.two_factor_codes;
DROP POLICY IF EXISTS "v16_2fa_select" ON public.two_factor_codes;
DROP POLICY IF EXISTS "v16_2fa_update" ON public.two_factor_codes;

CREATE POLICY "2fa_secure_select_v4" ON public.two_factor_codes
  FOR SELECT USING (user_id = auth.uid() AND expires_at > now());

CREATE POLICY "2fa_secure_update_v4" ON public.two_factor_codes
  FOR UPDATE USING (user_id = auth.uid() AND expires_at > now() AND verified = false)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "2fa_secure_delete_v4" ON public.two_factor_codes
  FOR DELETE USING (user_id = auth.uid() OR is_owner(auth.uid()));

-- ============================================
-- 7. USER_SESSIONS: Consolidar e anonimizar
-- ============================================
DROP POLICY IF EXISTS "sessions_insert_v32" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_select_v32" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_update_v32" ON public.user_sessions;
DROP POLICY IF EXISTS "system_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "users_update_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "users_view_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "v16_sessions_insert" ON public.user_sessions;
DROP POLICY IF EXISTS "v16_sessions_select" ON public.user_sessions;
DROP POLICY IF EXISTS "v16_sessions_update" ON public.user_sessions;

CREATE POLICY "sessions_secure_select_v4" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "sessions_secure_insert_v4" ON public.user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_secure_update_v4" ON public.user_sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_secure_delete_v4" ON public.user_sessions
  FOR DELETE USING (user_id = auth.uid() OR is_owner(auth.uid()));

-- ============================================
-- 8. ACTIVITY_LOG: Restringir inserções
-- ============================================
DROP POLICY IF EXISTS "Owner can delete activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert_v32" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select_v32" ON public.activity_log;
DROP POLICY IF EXISTS "v16_activity_insert" ON public.activity_log;
DROP POLICY IF EXISTS "v16_activity_select" ON public.activity_log;

CREATE POLICY "activity_secure_select_v4" ON public.activity_log
  FOR SELECT USING (user_id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "activity_secure_insert_v4" ON public.activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "activity_owner_delete_v4" ON public.activity_log
  FOR DELETE USING (is_owner(auth.uid()));

-- ============================================
-- 9. TRANSACTIONS: Proteger dados pessoais (usa created_by)
-- ============================================
DROP POLICY IF EXISTS "financial_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "financial_manage_transactions" ON public.transactions;
DROP POLICY IF EXISTS "financial_users_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_financial_manage" ON public.transactions;
DROP POLICY IF EXISTS "transactions_financial_select" ON public.transactions;
DROP POLICY IF EXISTS "v16_transactions_delete" ON public.transactions;
DROP POLICY IF EXISTS "v16_transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "v16_transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "v16_transactions_update" ON public.transactions;

CREATE POLICY "transactions_owner_personal_v4" ON public.transactions
  FOR ALL USING (
    CASE 
      WHEN is_personal = true THEN is_owner(auth.uid())
      ELSE can_view_financial(auth.uid())
    END
  ) WITH CHECK (
    CASE 
      WHEN is_personal = true THEN is_owner(auth.uid())
      ELSE can_view_financial(auth.uid())
    END
  );

-- ============================================
-- 10. TIME_CLOCK: Validação aprimorada (sem needs_approval)
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_time_clock_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Não permitir entradas futuras
  IF NEW.registered_at > now() + interval '5 minutes' THEN
    RAISE EXCEPTION 'Entradas futuras não são permitidas';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_time_clock_trigger ON public.time_clock_entries;
CREATE TRIGGER validate_time_clock_trigger
  BEFORE INSERT OR UPDATE ON public.time_clock_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_time_clock_entry();

-- ============================================
-- 11. ANALYTICS: Validação e anonimização
-- ============================================
DROP POLICY IF EXISTS "Owner/Admin manages analytics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "analytics_insert_v32" ON public.analytics_metrics;

CREATE POLICY "analytics_secure_insert_v4" ON public.analytics_metrics
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    metric_type IN ('page_view', 'pageview', 'click', 'scroll', 'session', 'event', 'error') AND
    (page_path IS NULL OR length(page_path) <= 500) AND
    (visitor_id IS NULL OR length(visitor_id) <= 100) AND
    (session_id IS NULL OR length(session_id) <= 100)
  );

CREATE POLICY "analytics_admin_select_v4" ON public.analytics_metrics
  FOR SELECT USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "analytics_admin_manage_v4" ON public.analytics_metrics
  FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- ============================================
-- 12. WHATSAPP_MESSAGES: Proteção de conteúdo
-- ============================================
DROP POLICY IF EXISTS "Admin gerencia mensagens" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Mensagens editáveis por owner e admin" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Mensagens visíveis para owner e admin" ON public.whatsapp_messages;

CREATE POLICY "messages_admin_manage_v4" ON public.whatsapp_messages
  FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- ============================================
-- 13. PAYMENT_TRANSACTIONS: Segurança de pagamentos
-- ============================================
DROP POLICY IF EXISTS "Admin manages payment_transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "users_view_own_payments" ON public.payment_transactions;

CREATE POLICY "payments_owner_view_v4" ON public.payment_transactions
  FOR SELECT USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "payments_admin_manage_v4" ON public.payment_transactions
  FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- ============================================
-- 14. USER_MFA_SETTINGS: Proteção de secrets
-- ============================================
DROP POLICY IF EXISTS "mfa_secure_select_v32" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "mfa_secure_insert_v32" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "mfa_secure_update_v32" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users manage own MFA settings" ON public.user_mfa_settings;

CREATE POLICY "mfa_secure_select_v4" ON public.user_mfa_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "mfa_secure_insert_v4" ON public.user_mfa_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "mfa_secure_update_v4" ON public.user_mfa_settings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "mfa_secure_delete_v4" ON public.user_mfa_settings
  FOR DELETE USING (user_id = auth.uid() OR is_owner(auth.uid()));

-- ============================================
-- 15. RECEIPT_OCR: Proteção de imagens
-- ============================================
DROP POLICY IF EXISTS "Users can manage own OCR extractions" ON public.receipt_ocr_extractions;

CREATE POLICY "ocr_user_own_data_v4" ON public.receipt_ocr_extractions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "ocr_admin_manage_v4" ON public.receipt_ocr_extractions
  FOR SELECT USING (is_admin_or_owner(auth.uid()));

-- ============================================
-- 16. FUNÇÃO DE LIMPEZA AUTOMÁTICA APRIMORADA
-- ============================================
CREATE OR REPLACE FUNCTION public.comprehensive_security_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar códigos 2FA expirados
  DELETE FROM public.two_factor_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  -- Anonimizar IPs antigos em activity_log (LGPD/GDPR)
  UPDATE public.activity_log 
  SET ip_address = 'anonymized', user_agent = 'anonymized'
  WHERE created_at < NOW() - INTERVAL '90 days' 
    AND ip_address IS NOT NULL 
    AND ip_address != 'anonymized';
  
  -- Limpar sessões inativas antigas
  DELETE FROM public.user_sessions
  WHERE is_active = false 
    AND logout_at < NOW() - INTERVAL '30 days';
  
  -- Anonimizar IPs em user_sessions antigas
  UPDATE public.user_sessions
  SET ip_address = 'anonymized', user_agent = 'anonymized'
  WHERE login_at < NOW() - INTERVAL '90 days'
    AND ip_address IS NOT NULL 
    AND ip_address != 'anonymized';
  
  -- Anonimizar analytics antigas
  UPDATE public.analytics_metrics
  SET visitor_id = 'anonymized', user_agent = 'anonymized'
  WHERE created_at < NOW() - INTERVAL '365 days'
    AND visitor_id IS NOT NULL 
    AND visitor_id != 'anonymized';
  
  -- Limpar mensagens de WhatsApp muito antigas (retenção de dados)
  DELETE FROM public.whatsapp_messages
  WHERE created_at < NOW() - INTERVAL '730 days';
  
  -- Log da limpeza
  INSERT INTO public.audit_logs (action, table_name, metadata)
  VALUES ('SECURITY_CLEANUP', 'multiple', jsonb_build_object(
    'executed_at', NOW(),
    'cleanup_type', 'comprehensive_v4'
  ));
END;
$$;

-- ============================================
-- 17. ÍNDICES DE PERFORMANCE E SEGURANÇA
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_id_secure ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_expires ON public.two_factor_codes(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_personal ON public.transactions(is_personal, created_by);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- ============================================
-- 18. COMENTÁRIO DE VERSÃO
-- ============================================
COMMENT ON SCHEMA public IS 'Schema público com políticas RLS v4.1 - Correção de segurança completa - 17/12/2025';
