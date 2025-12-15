-- ====================================
-- CORREÇÕES ADICIONAIS DE SEGURANÇA
-- ====================================

-- 1. Garantir RLS nas tabelas time_clock
ALTER TABLE public.time_clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_settings ENABLE ROW LEVEL SECURITY;

-- Verificar e criar políticas para time_clock_entries
DROP POLICY IF EXISTS "Employee views own entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admin manages time_clock_entries" ON public.time_clock_entries;

CREATE POLICY "Employee views own time_clock_entries"
ON public.time_clock_entries
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "Employee inserts own time_clock_entries"
ON public.time_clock_entries
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "Admin manages time_clock_entries"
ON public.time_clock_entries
FOR ALL
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 2. Políticas para time_clock_absences
DROP POLICY IF EXISTS "Employee views own absences" ON public.time_clock_absences;
DROP POLICY IF EXISTS "Admin manages absences" ON public.time_clock_absences;

CREATE POLICY "Admin manages time_clock_absences"
ON public.time_clock_absences
FOR ALL
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 3. Políticas para time_clock_reports
DROP POLICY IF EXISTS "Employee views own reports" ON public.time_clock_reports;
DROP POLICY IF EXISTS "Admin manages reports" ON public.time_clock_reports;

CREATE POLICY "Admin manages time_clock_reports"
ON public.time_clock_reports
FOR ALL
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 4. Políticas para time_clock_settings
DROP POLICY IF EXISTS "Employee views own settings" ON public.time_clock_settings;
DROP POLICY IF EXISTS "Admin manages settings" ON public.time_clock_settings;

CREATE POLICY "Admin manages time_clock_settings"
ON public.time_clock_settings
FOR ALL
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 5. Garantir RLS no user_mfa_settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own MFA" ON public.user_mfa_settings;

CREATE POLICY "Users manage own MFA settings"
ON public.user_mfa_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Garantir RLS na whatsapp_notifications
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages whatsapp" ON public.whatsapp_notifications;

CREATE POLICY "Admin manages whatsapp_notifications"
ON public.whatsapp_notifications
FOR ALL
TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- Sistema pode inserir (para webhooks)
CREATE POLICY "System inserts whatsapp_notifications"
ON public.whatsapp_notifications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. Garantir RLS em webhook_rate_limits
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages rate_limits"
ON public.webhook_rate_limits
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);