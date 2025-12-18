-- =============================================
-- SYNAPSE v17.1 - SECURITY FIX FOR MFA AND NOTIFICATIONS
-- Corrige RLS policies para tabelas sensíveis
-- =============================================

-- ===== FIX 1: user_mfa_settings =====
-- Remove políticas existentes que permitem leitura pública
DROP POLICY IF EXISTS "Users can view own mfa settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can insert own mfa settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can update own mfa settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Users can delete own mfa settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Anyone can view mfa settings" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "Public read access" ON public.user_mfa_settings;

-- Habilita RLS se ainda não estiver habilitado
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Cria políticas seguras - apenas o próprio usuário pode ver/editar suas configurações MFA
CREATE POLICY "Users can view own mfa settings"
ON public.user_mfa_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mfa settings"
ON public.user_mfa_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mfa settings"
ON public.user_mfa_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mfa settings"
ON public.user_mfa_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===== FIX 2: notifications =====
-- Remove políticas existentes que permitem leitura pública
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public read access" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Habilita RLS se ainda não estiver habilitado
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Cria políticas seguras - apenas o próprio usuário pode ver suas notificações
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Sistema pode criar notificações para qualquer usuário (via service role)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===== ADMIN ACCESS =====
-- Permite que owners/admins vejam todas as notificações para monitoramento
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can view all mfa settings"
ON public.user_mfa_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin')
  )
);