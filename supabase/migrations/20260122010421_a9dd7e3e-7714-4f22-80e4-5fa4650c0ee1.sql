-- =====================================================
-- FASE 2.1: CORREÇÃO MASSIVA DE POLÍTICAS INSEGURAS
-- Data: 2026-01-22
-- Objetivo: Eliminar ALL WITH CHECK(true) em roles public/authenticated
-- =====================================================

-- ==========================================
-- GRUPO A: Políticas {public} → Restringir para authenticated/service_role
-- Estas políticas permitem QUALQUER PESSOA inserir dados
-- ==========================================

-- 1. auditoria_grupo_beta_completo - apenas service_role
DROP POLICY IF EXISTS "Service role can manage audits" ON public.auditoria_grupo_beta_completo;
CREATE POLICY "auditoria_grupo_beta_service_only" ON public.auditoria_grupo_beta_completo
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. command_finance - apenas authenticated com admin check
DROP POLICY IF EXISTS "Service inserts command_finance" ON public.command_finance;
CREATE POLICY "command_finance_admin_only" ON public.command_finance
FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner(auth.uid()));

-- 3. command_tasks - apenas authenticated com admin check
DROP POLICY IF EXISTS "Service inserts command_tasks" ON public.command_tasks;
CREATE POLICY "command_tasks_admin_only" ON public.command_tasks
FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner(auth.uid()));

-- 4. conversas_tramon - apenas service_role
DROP POLICY IF EXISTS "Service role can manage conversations" ON public.conversas_tramon;
CREATE POLICY "conversas_tramon_service_only" ON public.conversas_tramon
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. dead_click_reports - authenticated com user_id check
DROP POLICY IF EXISTS "dcr_insert" ON public.dead_click_reports;
CREATE POLICY "dead_click_reports_insert_own" ON public.dead_click_reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. device_suspicious_events - apenas service_role (sistema monitora)
DROP POLICY IF EXISTS "System can manage all suspicious events" ON public.device_suspicious_events;
CREATE POLICY "device_suspicious_events_service_only" ON public.device_suspicious_events
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. emails_rd_station - apenas service_role
DROP POLICY IF EXISTS "Service role can insert emails" ON public.emails_rd_station;
CREATE POLICY "emails_rd_station_service_only" ON public.emails_rd_station
FOR INSERT TO service_role WITH CHECK (true);

-- 8. events - authenticated com user_id check
DROP POLICY IF EXISTS "Sistema pode inserir eventos" ON public.events;
CREATE POLICY "events_insert_own" ON public.events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 9. facebook_ads_metrics - apenas service_role
DROP POLICY IF EXISTS "Service can insert/update facebook_ads_metrics" ON public.facebook_ads_metrics;
CREATE POLICY "facebook_ads_metrics_service_only" ON public.facebook_ads_metrics
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 10. instagram_metrics - apenas service_role
DROP POLICY IF EXISTS "Service can insert instagram_metrics" ON public.instagram_metrics;
CREATE POLICY "instagram_metrics_service_only" ON public.instagram_metrics
FOR INSERT TO service_role WITH CHECK (true);

-- 11. sec_audit_insert e sec_audit_system_insert - apenas authenticated ou service_role
DROP POLICY IF EXISTS "sec_audit_insert" ON public.security_audit_log;
DROP POLICY IF EXISTS "sec_audit_system_insert" ON public.security_audit_log;
CREATE POLICY "security_audit_log_auth_insert" ON public.security_audit_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "security_audit_log_service_insert" ON public.security_audit_log
FOR INSERT TO service_role WITH CHECK (true);

-- 12. security_events_v2 - apenas authenticated com user_id ou service_role
DROP POLICY IF EXISTS "sec_events_v2_system_insert" ON public.security_events_v2;
CREATE POLICY "security_events_v2_insert_own" ON public.security_events_v2
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "security_events_v2_service_insert" ON public.security_events_v2
FOR INSERT TO service_role WITH CHECK (true);

-- 13. simulado_audit_logs - apenas authenticated com user_id
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.simulado_audit_logs;
CREATE POLICY "simulado_audit_logs_insert_own" ON public.simulado_audit_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 14. simulado_metrics - apenas authenticated ou service_role (sem user_id)
DROP POLICY IF EXISTS "Anyone can insert metrics" ON public.simulado_metrics;
CREATE POLICY "simulado_metrics_insert_auth" ON public.simulado_metrics
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- GRUPO B: Políticas {authenticated} → Adicionar auth.uid() checks
-- ==========================================

-- 15. activity_log - precisa de user_id check
DROP POLICY IF EXISTS "activity_insert" ON public.activity_log;
CREATE POLICY "activity_log_insert_own" ON public.activity_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 16. audit_logs - precisa de user_id check (já tem service_v17)
DROP POLICY IF EXISTS "audit_insert_v17" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 17. company_monthly_closures - admin only (sem user_id)
DROP POLICY IF EXISTS "Authenticated users can insert company monthly closures" ON public.company_monthly_closures;
CREATE POLICY "company_monthly_closures_admin_insert" ON public.company_monthly_closures
FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner(auth.uid()));

-- 18. company_yearly_closures - admin only
DROP POLICY IF EXISTS "Authenticated users can insert company yearly closures" ON public.company_yearly_closures;
CREATE POLICY "company_yearly_closures_admin_insert" ON public.company_yearly_closures
FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner(auth.uid()));

-- 19. content_history - authenticated apenas (sem user_id)
DROP POLICY IF EXISTS "system_insert_history" ON public.content_history;
CREATE POLICY "content_history_insert_auth" ON public.content_history
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 20. dispatch_audit_log - authenticated apenas (sem user_id)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.dispatch_audit_log;
CREATE POLICY "dispatch_audit_log_insert_auth" ON public.dispatch_audit_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 21. security_access_attempts - user_id check
DROP POLICY IF EXISTS "security_attempts_insert" ON public.security_access_attempts;
CREATE POLICY "security_access_attempts_insert_own" ON public.security_access_attempts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 22. security_risk_state - user_id check
DROP POLICY IF EXISTS "Sistema pode inserir/atualizar risk states" ON public.security_risk_state;
CREATE POLICY "security_risk_state_insert_own" ON public.security_risk_state
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 23. security_violations_log - user_id check para auth, manter service
DROP POLICY IF EXISTS "security_violations_insert_auth" ON public.security_violations_log;
CREATE POLICY "security_violations_log_insert_own" ON public.security_violations_log
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- service_role policy already uses service_role only, keep it

-- 24. ui_audit_events - user_id check
DROP POLICY IF EXISTS "uae_insert" ON public.ui_audit_events;
CREATE POLICY "ui_audit_events_insert_own" ON public.ui_audit_events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 25. url_access_logs - user_id check
DROP POLICY IF EXISTS "ual_insert" ON public.url_access_logs;
CREATE POLICY "url_access_logs_insert_own" ON public.url_access_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 26. system_realtime_logs - user_id check ou service
DROP POLICY IF EXISTS "System can insert logs" ON public.system_realtime_logs;
CREATE POLICY "system_realtime_logs_insert_own" ON public.system_realtime_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "system_realtime_logs_service_insert" ON public.system_realtime_logs
FOR INSERT TO service_role WITH CHECK (true);

-- 27. whatsapp_notifications - user_id check
DROP POLICY IF EXISTS "wn_insert" ON public.whatsapp_notifications;
CREATE POLICY "whatsapp_notifications_insert_own" ON public.whatsapp_notifications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- GRUPO C: Políticas service_role only que usam {public}
-- Corrigir para usar TO service_role explícito
-- ==========================================

-- 28. tarefas - service_role only
DROP POLICY IF EXISTS "Service can insert tarefas" ON public.tarefas;
CREATE POLICY "tarefas_service_insert" ON public.tarefas
FOR INSERT TO service_role WITH CHECK (true);

-- 29. webhook_diagnostics - service_role only
DROP POLICY IF EXISTS "Service inserts webhook_diagnostics" ON public.webhook_diagnostics;
CREATE POLICY "webhook_diagnostics_service_insert" ON public.webhook_diagnostics
FOR INSERT TO service_role WITH CHECK (true);

-- 30. webhook_events - service_role only
DROP POLICY IF EXISTS "webhooks_system_insert" ON public.webhook_events;
CREATE POLICY "webhook_events_service_insert" ON public.webhook_events
FOR INSERT TO service_role WITH CHECK (true);

-- 31. whatsapp_attachments - service_role only
DROP POLICY IF EXISTS "Service inserts whatsapp_attachments" ON public.whatsapp_attachments;
CREATE POLICY "whatsapp_attachments_service_insert" ON public.whatsapp_attachments
FOR INSERT TO service_role WITH CHECK (true);

-- 32. whatsapp_conversation_history - service_role only
DROP POLICY IF EXISTS "Service inserts whatsapp_conversation_history" ON public.whatsapp_conversation_history;
CREATE POLICY "whatsapp_conversation_history_service_insert" ON public.whatsapp_conversation_history
FOR INSERT TO service_role WITH CHECK (true);

-- 33. whatsapp_conversations - service_role only
DROP POLICY IF EXISTS "Service inserts whatsapp_conversations" ON public.whatsapp_conversations;
CREATE POLICY "whatsapp_conversations_service_insert" ON public.whatsapp_conversations
FOR INSERT TO service_role WITH CHECK (true);

-- 34. whatsapp_leads - service_role only
DROP POLICY IF EXISTS "Service inserts whatsapp_leads" ON public.whatsapp_leads;
CREATE POLICY "whatsapp_leads_service_insert" ON public.whatsapp_leads
FOR INSERT TO service_role WITH CHECK (true);

-- 35. social_media_history - service_role only
DROP POLICY IF EXISTS "social_media_history_insert" ON public.social_media_history;
CREATE POLICY "social_media_history_service_insert" ON public.social_media_history
FOR INSERT TO service_role WITH CHECK (true);