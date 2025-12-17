-- =====================================================
-- 🔒 CORREÇÃO MASSIVA DE SEGURANÇA v5.0 - TODAS AS 16 VULNERABILIDADES
-- =====================================================

-- 1. PROFILES - Restringir acesso apenas ao próprio usuário
DROP POLICY IF EXISTS "profiles_select_own_v4" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_v4" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;

CREATE POLICY "profiles_select_strict" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR public.is_owner(auth.uid())
);

CREATE POLICY "profiles_update_strict" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR public.is_owner(auth.uid())
);

-- 2. EMPLOYEES - Apenas admin/owner vê dados completos
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_select_v2" ON public.employees;
DROP POLICY IF EXISTS "Visualizar funcionários" ON public.employees;

CREATE POLICY "employees_select_secure" ON public.employees
FOR SELECT USING (
  public.is_admin_or_owner(auth.uid()) OR
  user_id = auth.uid()
);

-- 3. EMPLOYEE_COMPENSATION - Somente owner
DROP POLICY IF EXISTS "employee_comp_owner_only_v4" ON public.employee_compensation;
DROP POLICY IF EXISTS "compensation_select_policy" ON public.employee_compensation;
DROP POLICY IF EXISTS "Apenas owner vê salários" ON public.employee_compensation;

CREATE POLICY "compensation_owner_only_strict" ON public.employee_compensation
FOR SELECT USING (public.is_owner(auth.uid()));

CREATE POLICY "compensation_owner_manage" ON public.employee_compensation
FOR ALL USING (public.is_owner(auth.uid()));

-- 4. AFFILIATES - Dados bancários sensíveis
DROP POLICY IF EXISTS "affiliates_owner_only_v4" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_select_policy" ON public.affiliates;

CREATE POLICY "affiliates_admin_only" ON public.affiliates
FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "affiliates_admin_manage" ON public.affiliates
FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- 5. ALUNOS - Dados de estudantes protegidos
DROP POLICY IF EXISTS "alunos_owner_only_v4" ON public.alunos;
DROP POLICY IF EXISTS "alunos_select_policy" ON public.alunos;

CREATE POLICY "alunos_admin_select" ON public.alunos
FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "alunos_admin_manage" ON public.alunos
FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- 6. WHATSAPP_LEADS - Leads de marketing protegidos
DROP POLICY IF EXISTS "whatsapp_leads_admin_only_v4" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_select_policy" ON public.whatsapp_leads;

CREATE POLICY "whatsapp_leads_secure" ON public.whatsapp_leads
FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "whatsapp_leads_manage" ON public.whatsapp_leads
FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- 7. WHATSAPP_CONVERSATIONS - Conversas de clientes
DROP POLICY IF EXISTS "whatsapp_conversations_admin_v4" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conv_policy" ON public.whatsapp_conversations;

CREATE POLICY "whatsapp_conv_secure" ON public.whatsapp_conversations
FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "whatsapp_conv_manage" ON public.whatsapp_conversations
FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- 8. WHATSAPP_MESSAGES - Mensagens privadas
DROP POLICY IF EXISTS "whatsapp_msg_admin_only_v4" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_policy" ON public.whatsapp_messages;

CREATE POLICY "whatsapp_msg_secure" ON public.whatsapp_messages
FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "whatsapp_msg_manage" ON public.whatsapp_messages
FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- 9. USER_MFA_SETTINGS - Segredos 2FA (somente próprio usuário)
DROP POLICY IF EXISTS "mfa_user_only_v4" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "mfa_settings_policy" ON public.user_mfa_settings;

CREATE POLICY "mfa_user_only_select" ON public.user_mfa_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mfa_user_only_manage" ON public.user_mfa_settings
FOR ALL USING (auth.uid() = user_id);

-- 10. TWO_FACTOR_CODES - Códigos 2FA (somente próprio usuário)
DROP POLICY IF EXISTS "2fa_user_only_v4" ON public.two_factor_codes;
DROP POLICY IF EXISTS "two_factor_codes_policy" ON public.two_factor_codes;

CREATE POLICY "2fa_codes_user_only" ON public.two_factor_codes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "2fa_codes_user_manage" ON public.two_factor_codes
FOR ALL USING (auth.uid() = user_id);

-- 11. TRANSACTIONS - Transações financeiras com isolamento
DROP POLICY IF EXISTS "transactions_secure_v4" ON public.transactions;
DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;

CREATE POLICY "transactions_secure_access" ON public.transactions
FOR SELECT USING (
  CASE 
    WHEN is_personal = true THEN public.is_owner(auth.uid())
    ELSE public.is_admin_or_owner(auth.uid()) OR created_by = auth.uid()
  END
);

CREATE POLICY "transactions_secure_manage" ON public.transactions
FOR ALL USING (
  CASE 
    WHEN is_personal = true THEN public.is_owner(auth.uid())
    ELSE public.is_admin_or_owner(auth.uid()) OR created_by = auth.uid()
  END
);

-- 12. PAYMENT_TRANSACTIONS - Pagamentos
DROP POLICY IF EXISTS "payment_transactions_policy" ON public.payment_transactions;

CREATE POLICY "payment_secure_select" ON public.payment_transactions
FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "payment_secure_manage" ON public.payment_transactions
FOR ALL USING (
  auth.uid() = user_id OR public.is_admin_or_owner(auth.uid())
);

-- 13. BANK_ACCOUNTS - Contas bancárias
DROP POLICY IF EXISTS "bank_accounts_policy" ON public.bank_accounts;

CREATE POLICY "bank_accounts_secure" ON public.bank_accounts
FOR SELECT USING (
  CASE 
    WHEN is_personal = true THEN public.is_owner(auth.uid())
    ELSE public.is_admin_or_owner(auth.uid()) OR created_by = auth.uid()
  END
);

CREATE POLICY "bank_accounts_manage" ON public.bank_accounts
FOR ALL USING (
  CASE 
    WHEN is_personal = true THEN public.is_owner(auth.uid())
    ELSE public.is_admin_or_owner(auth.uid()) OR created_by = auth.uid()
  END
);

-- 14. USER_SESSIONS - Sessões (somente próprio usuário ou owner)
DROP POLICY IF EXISTS "user_sessions_secure_v4" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_policy" ON public.user_sessions;

CREATE POLICY "sessions_user_own" ON public.user_sessions
FOR SELECT USING (
  auth.uid() = user_id OR public.is_owner(auth.uid())
);

CREATE POLICY "sessions_user_manage" ON public.user_sessions
FOR ALL USING (
  auth.uid() = user_id OR public.is_owner(auth.uid())
);

-- 15. ACTIVITY_LOG - Logs de atividade
DROP POLICY IF EXISTS "activity_log_secure_v4" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_policy" ON public.activity_log;

CREATE POLICY "activity_log_user_own" ON public.activity_log
FOR SELECT USING (
  auth.uid() = user_id OR public.is_owner(auth.uid())
);

CREATE POLICY "activity_log_insert" ON public.activity_log
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- 16. ANALYTICS_METRICS - Métricas (admin apenas para leitura)
DROP POLICY IF EXISTS "analytics_admin_v4" ON public.analytics_metrics;
DROP POLICY IF EXISTS "analytics_policy" ON public.analytics_metrics;

CREATE POLICY "analytics_admin_read" ON public.analytics_metrics
FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

-- INDEXES para performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_is_personal ON public.transactions(is_personal);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_expires ON public.two_factor_codes(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conv ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_created_by ON public.bank_accounts(created_by);

-- Comentário de auditoria
COMMENT ON SCHEMA public IS 'Schema público com RLS v5.0 - Todas as 16 vulnerabilidades corrigidas em 2024-12-17';