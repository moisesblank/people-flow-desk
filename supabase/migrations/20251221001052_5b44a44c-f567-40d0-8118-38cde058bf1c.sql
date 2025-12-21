-- ================================================================
-- MEGA SECURITY UPGRADE v1.2 - Logs de Auditoria Imutáveis
-- ================================================================

-- ==============================================
-- 11. AUDIT_LOGS - Append-only, apenas Owner pode ver
-- ==============================================
DROP POLICY IF EXISTS "audit_logs_select_owner" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;
DROP POLICY IF EXISTS "Owner pode ver audit logs" ON public.audit_logs;

-- Apenas owner pode VER logs
CREATE POLICY "audit_logs_select_owner" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

-- Sistema pode inserir (via triggers/functions)
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- NINGUÉM pode atualizar ou deletar (imutável)
-- Não criar policies de UPDATE/DELETE = bloqueado por RLS

-- ==============================================
-- 12. ACTIVITY_LOG - Usuário vê próprio, Owner vê todos
-- ==============================================
DROP POLICY IF EXISTS "activity_log_select_secure" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert_system" ON public.activity_log;
DROP POLICY IF EXISTS "Owner pode ver logs" ON public.activity_log;

CREATE POLICY "activity_log_select_secure" ON public.activity_log
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_owner(auth.uid())
);

CREATE POLICY "activity_log_insert_system" ON public.activity_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- ==============================================
-- 13. ADMIN_AUDIT_LOG - Apenas Owner
-- ==============================================
DROP POLICY IF EXISTS "admin_audit_select_owner" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_insert_system" ON public.admin_audit_log;

CREATE POLICY "admin_audit_select_owner" ON public.admin_audit_log
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "admin_audit_insert_system" ON public.admin_audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- ==============================================
-- 14. SECURITY_EVENTS - Apenas Owner
-- ==============================================
DROP POLICY IF EXISTS "security_events_select_owner" ON public.security_events;
DROP POLICY IF EXISTS "security_events_insert_system" ON public.security_events;

CREATE POLICY "security_events_select_owner" ON public.security_events
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "security_events_insert_system" ON public.security_events
FOR INSERT TO authenticated
WITH CHECK (true);

-- ==============================================
-- 15. USER_SESSIONS - Usuário vê suas próprias, Owner vê todas
-- ==============================================
DROP POLICY IF EXISTS "user_sessions_select_secure" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_update_own" ON public.user_sessions;
DROP POLICY IF EXISTS "Usuários podem ver suas sessões" ON public.user_sessions;

CREATE POLICY "user_sessions_select_secure" ON public.user_sessions
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_owner(auth.uid())
);

CREATE POLICY "user_sessions_insert_own" ON public.user_sessions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_update_own" ON public.user_sessions
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ==============================================
-- 16. WEBHOOKS_QUEUE - Apenas Owner/Admin
-- ==============================================
DROP POLICY IF EXISTS "webhooks_queue_select_admin" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_queue_insert_system" ON public.webhooks_queue;
DROP POLICY IF EXISTS "webhooks_queue_update_admin" ON public.webhooks_queue;

CREATE POLICY "webhooks_queue_select_admin" ON public.webhooks_queue
FOR SELECT TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "webhooks_queue_insert_system" ON public.webhooks_queue
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "webhooks_queue_update_admin" ON public.webhooks_queue
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ==============================================
-- 17. PAYMENT_TRANSACTIONS - Apenas Owner/Admin
-- ==============================================
DROP POLICY IF EXISTS "payment_transactions_select_admin" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_admin" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_admin" ON public.payment_transactions;

CREATE POLICY "payment_transactions_select_admin" ON public.payment_transactions
FOR SELECT TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "payment_transactions_insert_admin" ON public.payment_transactions
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "payment_transactions_update_admin" ON public.payment_transactions
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ==============================================
-- 18. CONTAS PAGAR/RECEBER - Financeiro + Owner
-- ==============================================
DROP POLICY IF EXISTS "contas_pagar_select_finance" ON public.contas_pagar;
DROP POLICY IF EXISTS "contas_pagar_insert_finance" ON public.contas_pagar;
DROP POLICY IF EXISTS "contas_pagar_update_finance" ON public.contas_pagar;
DROP POLICY IF EXISTS "contas_pagar_delete_owner" ON public.contas_pagar;

CREATE POLICY "contas_pagar_select_finance" ON public.contas_pagar
FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "contas_pagar_insert_finance" ON public.contas_pagar
FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "contas_pagar_update_finance" ON public.contas_pagar
FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "contas_pagar_delete_owner" ON public.contas_pagar
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 19. TIME_CLOCK_ENTRIES - Funcionário vê próprio, Owner vê todos
-- ==============================================
DROP POLICY IF EXISTS "time_clock_select_secure" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_insert_own" ON public.time_clock_entries;
DROP POLICY IF EXISTS "time_clock_update_admin" ON public.time_clock_entries;

CREATE POLICY "time_clock_select_secure" ON public.time_clock_entries
FOR SELECT TO authenticated
USING (
  employee_id::text IN (
    SELECT id::text FROM employees WHERE user_id = auth.uid() OR email = public.current_user_email()
  )
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "time_clock_insert_own" ON public.time_clock_entries
FOR INSERT TO authenticated
WITH CHECK (
  employee_id::text IN (
    SELECT id::text FROM employees WHERE user_id = auth.uid() OR email = public.current_user_email()
  )
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "time_clock_update_admin" ON public.time_clock_entries
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ==============================================
-- 20. FOLHA_PAGAMENTO - Apenas Owner (dados ultra sensíveis)
-- ==============================================
DROP POLICY IF EXISTS "folha_pagamento_select_owner" ON public.folha_pagamento;
DROP POLICY IF EXISTS "folha_pagamento_insert_owner" ON public.folha_pagamento;
DROP POLICY IF EXISTS "folha_pagamento_update_owner" ON public.folha_pagamento;
DROP POLICY IF EXISTS "folha_pagamento_delete_owner" ON public.folha_pagamento;

CREATE POLICY "folha_pagamento_select_owner" ON public.folha_pagamento
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "folha_pagamento_insert_owner" ON public.folha_pagamento
FOR INSERT TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "folha_pagamento_update_owner" ON public.folha_pagamento
FOR UPDATE TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "folha_pagamento_delete_owner" ON public.folha_pagamento
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 21. CERTIFICATES - Usuário vê próprios, Admin vê todos
-- ==============================================
DROP POLICY IF EXISTS "certificates_select_secure" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_admin" ON public.certificates;
DROP POLICY IF EXISTS "certificates_update_admin" ON public.certificates;

CREATE POLICY "certificates_select_secure" ON public.certificates
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "certificates_insert_admin" ON public.certificates
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "certificates_update_admin" ON public.certificates
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ==============================================
-- 22. GENERAL_DOCUMENTS - Document Managers + Owner
-- ==============================================
DROP POLICY IF EXISTS "general_documents_select_secure" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_insert_secure" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_update_secure" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_delete_owner" ON public.general_documents;

CREATE POLICY "general_documents_select_secure" ON public.general_documents
FOR SELECT TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.can_manage_documents(auth.uid())
);

CREATE POLICY "general_documents_insert_secure" ON public.general_documents
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_documents(auth.uid()));

CREATE POLICY "general_documents_update_secure" ON public.general_documents
FOR UPDATE TO authenticated
USING (public.can_manage_documents(auth.uid()))
WITH CHECK (public.can_manage_documents(auth.uid()));

CREATE POLICY "general_documents_delete_owner" ON public.general_documents
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));