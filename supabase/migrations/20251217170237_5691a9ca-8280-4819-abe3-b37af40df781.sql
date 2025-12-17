-- =====================================================
-- SECURITY HARDENING v16.1 - COMPREHENSIVE FIX
-- Drop all existing policies first, then recreate
-- =====================================================

-- AFFILIATES: Drop all existing policies
DROP POLICY IF EXISTS "Admins can insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Users can view own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate or admin" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can delete affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates viewable by admin" ON public.affiliates;
DROP POLICY IF EXISTS "Users can view own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;

-- Now create new policies for affiliates
CREATE POLICY "v16_affiliates_select"
ON public.affiliates FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_affiliates_insert"
ON public.affiliates FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_affiliates_update"
ON public.affiliates FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_affiliates_delete"
ON public.affiliates FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- ALUNOS: Drop all existing policies
DROP POLICY IF EXISTS "Admins can insert alunos" ON public.alunos;
DROP POLICY IF EXISTS "Users view own student data by email" ON public.alunos;
DROP POLICY IF EXISTS "Admins can update alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins can delete alunos" ON public.alunos;

-- Create new policies for alunos
CREATE POLICY "v16_alunos_select"
ON public.alunos FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "v16_alunos_insert"
ON public.alunos FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_alunos_update"
ON public.alunos FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_alunos_delete"
ON public.alunos FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- USER_MFA_SETTINGS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own MFA settings only" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users insert own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users update own MFA settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users delete own MFA settings" ON public.user_mfa_settings;

-- Create new policies for user_mfa_settings
CREATE POLICY "v16_mfa_select"
ON public.user_mfa_settings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_mfa_insert"
ON public.user_mfa_settings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_mfa_update"
ON public.user_mfa_settings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_mfa_delete"
ON public.user_mfa_settings FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- TWO_FACTOR_CODES: Drop all existing policies
DROP POLICY IF EXISTS "Users view own 2FA codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "System can insert 2FA codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "System can update 2FA codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "Users delete own 2FA codes" ON public.two_factor_codes;

-- Create new policies for two_factor_codes
CREATE POLICY "v16_2fa_select"
ON public.two_factor_codes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_2fa_insert"
ON public.two_factor_codes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_2fa_update"
ON public.two_factor_codes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_2fa_delete"
ON public.two_factor_codes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- WHATSAPP_LEADS: Drop all existing policies
DROP POLICY IF EXISTS "Admins can view whatsapp leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Admins can insert whatsapp leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Admins can update whatsapp leads" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "Admins can delete whatsapp leads" ON public.whatsapp_leads;

-- Create new policies for whatsapp_leads
CREATE POLICY "v16_whatsapp_leads_select"
ON public.whatsapp_leads FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_whatsapp_leads_insert"
ON public.whatsapp_leads FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_whatsapp_leads_update"
ON public.whatsapp_leads FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_whatsapp_leads_delete"
ON public.whatsapp_leads FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- WHATSAPP_CONVERSATIONS: Drop all existing policies
DROP POLICY IF EXISTS "Admins can view conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admins can insert conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON public.whatsapp_conversations;

-- Create new policies for whatsapp_conversations
CREATE POLICY "v16_wa_conversations_select"
ON public.whatsapp_conversations FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_wa_conversations_insert"
ON public.whatsapp_conversations FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_wa_conversations_update"
ON public.whatsapp_conversations FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_wa_conversations_delete"
ON public.whatsapp_conversations FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- WHATSAPP_MESSAGES: Drop all existing policies
DROP POLICY IF EXISTS "Admins can view messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.whatsapp_messages;

-- Create new policies for whatsapp_messages
CREATE POLICY "v16_wa_messages_select"
ON public.whatsapp_messages FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_wa_messages_insert"
ON public.whatsapp_messages FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_wa_messages_update"
ON public.whatsapp_messages FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_wa_messages_delete"
ON public.whatsapp_messages FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- PAYMENT_TRANSACTIONS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users insert own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can update payment transactions" ON public.payment_transactions;

-- Create new policies for payment_transactions
CREATE POLICY "v16_payment_select"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_payment_insert"
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_payment_update"
ON public.payment_transactions FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- WOOCOMMERCE_ORDERS: Drop all existing policies
DROP POLICY IF EXISTS "Admins can view woocommerce orders" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "Admins can insert woocommerce orders" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "Admins can update woocommerce orders" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "Admins can delete woocommerce orders" ON public.woocommerce_orders;

-- Create new policies for woocommerce_orders
CREATE POLICY "v16_woo_select"
ON public.woocommerce_orders FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_woo_insert"
ON public.woocommerce_orders FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_woo_update"
ON public.woocommerce_orders FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_woo_delete"
ON public.woocommerce_orders FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- RECEIPT_OCR_EXTRACTIONS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own receipt extractions" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "Users insert own receipt extractions" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "Users update own receipt extractions" ON public.receipt_ocr_extractions;
DROP POLICY IF EXISTS "Users delete own receipt extractions" ON public.receipt_ocr_extractions;

-- Create new policies for receipt_ocr_extractions
CREATE POLICY "v16_receipt_select"
ON public.receipt_ocr_extractions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_receipt_insert"
ON public.receipt_ocr_extractions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_receipt_update"
ON public.receipt_ocr_extractions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_receipt_delete"
ON public.receipt_ocr_extractions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ACTIVITY_LOG: Drop all existing policies
DROP POLICY IF EXISTS "Users view own activity log" ON public.activity_log;
DROP POLICY IF EXISTS "System can insert activity log" ON public.activity_log;

-- Create new policies for activity_log
CREATE POLICY "v16_activity_select"
ON public.activity_log FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

CREATE POLICY "v16_activity_insert"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

-- USER_SESSIONS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own sessions only" ON public.user_sessions;
DROP POLICY IF EXISTS "System insert sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System update sessions" ON public.user_sessions;

-- Create new policies for user_sessions
CREATE POLICY "v16_sessions_select"
ON public.user_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

CREATE POLICY "v16_sessions_insert"
ON public.user_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_sessions_update"
ON public.user_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- NOTIFICATIONS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;

-- Create new policies for notifications
CREATE POLICY "v16_notifications_select"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_notifications_insert"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_notifications_update"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_notifications_delete"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- CERTIFICATES: Drop all existing policies
DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "System insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins update certificates" ON public.certificates;

-- Create new policies for certificates
CREATE POLICY "v16_certificates_select"
ON public.certificates FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_certificates_insert"
ON public.certificates FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_certificates_update"
ON public.certificates FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- ENROLLMENTS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users insert own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users update own enrollments" ON public.enrollments;

-- Create new policies for enrollments
CREATE POLICY "v16_enrollments_select"
ON public.enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_enrollments_insert"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_enrollments_update"
ON public.enrollments FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

-- QUIZ_ATTEMPTS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users insert own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users update own quiz attempts" ON public.quiz_attempts;

-- Create new policies for quiz_attempts
CREATE POLICY "v16_quiz_select"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_quiz_insert"
ON public.quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_quiz_update"
ON public.quiz_attempts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- LESSON_PROGRESS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users insert own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users update own lesson progress" ON public.lesson_progress;

-- Create new policies for lesson_progress
CREATE POLICY "v16_lesson_progress_select"
ON public.lesson_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "v16_lesson_progress_insert"
ON public.lesson_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_lesson_progress_update"
ON public.lesson_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- FINANCIAL_GOALS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users insert own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users update own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users delete own financial goals" ON public.financial_goals;

-- Create new policies for financial_goals
CREATE POLICY "v16_goals_select"
ON public.financial_goals FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

CREATE POLICY "v16_goals_insert"
ON public.financial_goals FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_goals_update"
ON public.financial_goals FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_goals_delete"
ON public.financial_goals FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- TRANSACTIONS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own or company transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users delete own transactions" ON public.transactions;

-- Create new policies for transactions
CREATE POLICY "v16_transactions_select"
ON public.transactions FOR SELECT
TO authenticated
USING (
  (is_personal = true AND created_by = auth.uid())
  OR (is_personal = false AND public.is_admin_or_owner(auth.uid()))
  OR public.is_owner(auth.uid())
);

CREATE POLICY "v16_transactions_insert"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  (is_personal = true AND created_by = auth.uid())
  OR (is_personal = false AND public.is_admin_or_owner(auth.uid()))
);

CREATE POLICY "v16_transactions_update"
ON public.transactions FOR UPDATE
TO authenticated
USING (
  (is_personal = true AND created_by = auth.uid())
  OR (is_personal = false AND public.is_admin_or_owner(auth.uid()))
);

CREATE POLICY "v16_transactions_delete"
ON public.transactions FOR DELETE
TO authenticated
USING (
  (is_personal = true AND created_by = auth.uid())
  OR (is_personal = false AND public.is_admin_or_owner(auth.uid()))
);

-- CALENDAR_TASKS: Drop all existing policies
DROP POLICY IF EXISTS "Users view own calendar tasks" ON public.calendar_tasks;
DROP POLICY IF EXISTS "Users insert own calendar tasks" ON public.calendar_tasks;
DROP POLICY IF EXISTS "Users update own calendar tasks" ON public.calendar_tasks;
DROP POLICY IF EXISTS "Users delete own calendar tasks" ON public.calendar_tasks;

-- Create new policies for calendar_tasks
CREATE POLICY "v16_calendar_select"
ON public.calendar_tasks FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

CREATE POLICY "v16_calendar_insert"
ON public.calendar_tasks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "v16_calendar_update"
ON public.calendar_tasks FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "v16_calendar_delete"
ON public.calendar_tasks FOR DELETE
TO authenticated
USING (user_id = auth.uid());