-- ============================================
-- MIGRATION v17.5: CONSOLIDAÇÃO MASSIVA - PARTE 2
-- user_sessions, two_factor_codes, activity_log, notifications
-- ============================================

-- ========== USER_SESSIONS (16 → 4) ==========
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "session_single_user_only" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_user_manage" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_secure_delete_v4" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_secure_insert_v4" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert_own" ON public.user_sessions;
DROP POLICY IF EXISTS "Owner can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_secure_select_v4" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_select_own" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_user_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_select_secure" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_secure_update_v4" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_update_own" ON public.user_sessions;

CREATE POLICY "sessions_select" ON public.user_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "sessions_insert" ON public.user_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update" ON public.user_sessions FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_delete" ON public.user_sessions FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));

-- ========== TWO_FACTOR_CODES (12 → 4) ==========
DROP POLICY IF EXISTS "2fa_codes_user_manage" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_delete_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_secure_delete_v4" ON public.two_factor_codes;
DROP POLICY IF EXISTS "two_factor_codes_delete_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_insert_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "two_factor_codes_insert_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_codes_user_only" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_secure_select_v4" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_select_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "two_factor_codes_select_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_secure_update_v4" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_update_own" ON public.two_factor_codes;

CREATE POLICY "2fa_select" ON public.two_factor_codes FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "2fa_insert" ON public.two_factor_codes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "2fa_update" ON public.two_factor_codes FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "2fa_delete" ON public.two_factor_codes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ========== ACTIVITY_LOG (11 → 3) ==========
DROP POLICY IF EXISTS "activity_owner_delete_v4" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert_system" ON public.activity_log;
DROP POLICY IF EXISTS "activity_secure_insert_v4" ON public.activity_log;
DROP POLICY IF EXISTS "Owner can view all activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select_owner" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select_secure" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_user_own" ON public.activity_log;
DROP POLICY IF EXISTS "activity_secure_select_v4" ON public.activity_log;

CREATE POLICY "activity_select" ON public.activity_log FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "activity_insert" ON public.activity_log FOR INSERT TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "activity_delete" ON public.activity_log FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- ========== NOTIFICATIONS (10 → 4) ==========
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "v16_notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "v16_notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "v16_notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "v16_notifications_update" ON public.notifications;

CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "notif_update" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notif_delete" ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));