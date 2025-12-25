-- ============================================
-- MIGRAÇÃO: Consolidar RLS BLOCO 3.1 - Lote 4 FINAL (4 tabelas)
-- ============================================

-- ====== 1. alertas_sistema (6→4) ======
DROP POLICY IF EXISTS "Owner can manage alerts" ON public.alertas_sistema;
DROP POLICY IF EXISTS "Owner can view all alerts" ON public.alertas_sistema;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alertas_sistema;
DROP POLICY IF EXISTS "alertas_insert_system" ON public.alertas_sistema;
DROP POLICY IF EXISTS "alertas_select_admin" ON public.alertas_sistema;
DROP POLICY IF EXISTS "alertas_update_admin" ON public.alertas_sistema;

CREATE POLICY "alertas_select_v17" ON public.alertas_sistema FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "alertas_insert_v17" ON public.alertas_sistema FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "alertas_update_v17" ON public.alertas_sistema FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "alertas_service_v17" ON public.alertas_sistema FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 2. live_chat_settings (6→4) ======
DROP POLICY IF EXISTS "Admins podem gerenciar configurações" ON public.live_chat_settings;
DROP POLICY IF EXISTS "Todos podem ver configurações" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_delete" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_insert" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_select" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_update" ON public.live_chat_settings;

-- Settings são públicas para leitura, admin gerencia
CREATE POLICY "settings_select_v17" ON public.live_chat_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "settings_insert_v17" ON public.live_chat_settings FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "settings_update_v17" ON public.live_chat_settings FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "settings_service_v17" ON public.live_chat_settings FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 3. quiz_questions (6→4) ======
DROP POLICY IF EXISTS "Admin can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admin gerencia questões" ON public.quiz_questions;
DROP POLICY IF EXISTS "Questões de quizzes publicados" ON public.quiz_questions;
DROP POLICY IF EXISTS "Students can view published quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_manage" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_select" ON public.quiz_questions;

-- Alunos veem questões de quizzes publicados, admin gerencia
CREATE POLICY "questions_select_v17" ON public.quiz_questions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_id AND q.is_published = true)
  OR is_admin_or_owner(auth.uid())
);

CREATE POLICY "questions_insert_v17" ON public.quiz_questions FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "questions_update_v17" ON public.quiz_questions FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "questions_service_v17" ON public.quiz_questions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 4. whatsapp_notifications (6→4) ======
DROP POLICY IF EXISTS "Admin gerencia notificações WhatsApp" ON public.whatsapp_notifications;
DROP POLICY IF EXISTS "Admin manages whatsapp notifications" ON public.whatsapp_notifications;
DROP POLICY IF EXISTS "Admin manages whatsapp_notifications" ON public.whatsapp_notifications;
DROP POLICY IF EXISTS "System inserts whatsapp_notifications" ON public.whatsapp_notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON public.whatsapp_notifications;
DROP POLICY IF EXISTS "Usuário vê próprias notificações" ON public.whatsapp_notifications;

CREATE POLICY "wpnotif_select_v17" ON public.whatsapp_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "wpnotif_insert_v17" ON public.whatsapp_notifications FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "wpnotif_update_v17" ON public.whatsapp_notifications FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "wpnotif_service_v17" ON public.whatsapp_notifications FOR ALL TO service_role
USING (true) WITH CHECK (true);