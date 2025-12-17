-- =====================================================
-- CORREÇÃO DE SEGURANÇA v3.2 - CORRIGIDA
-- =====================================================

-- 1. PROFILES: Consolidar políticas
DROP POLICY IF EXISTS "Profiles view own" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile update own" ON public.profiles;
DROP POLICY IF EXISTS "Profile insert own" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_on_signup" ON public.profiles;

CREATE POLICY "profiles_select_v3"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() 
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "profiles_update_v3"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "profiles_insert_v3"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- 2. ACTIVITY LOG
DROP POLICY IF EXISTS "Users can insert own logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert_limited" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select_own_or_admin" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert_v3" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select_v3" ON public.activity_log;

CREATE POLICY "activity_log_insert_v32"
ON public.activity_log FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "activity_log_select_v32"
ON public.activity_log FOR SELECT
USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

-- 3. USER SESSIONS
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_select_own_only" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_insert_own_only" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_update_own_only" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_select_v3" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_insert_v3" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_update_v3" ON public.user_sessions;

CREATE POLICY "sessions_select_v32"
ON public.user_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "sessions_insert_v32"
ON public.user_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update_v32"
ON public.user_sessions FOR UPDATE
USING (user_id = auth.uid());

-- 4. TWO FACTOR CODES
DROP POLICY IF EXISTS "Users can view own codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "Users can update own codes" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_select_own_unexpired" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_update_own_valid" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_select_v3" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_update_v3" ON public.two_factor_codes;

CREATE POLICY "2fa_select_v32"
ON public.two_factor_codes FOR SELECT
USING (user_id = auth.uid() AND expires_at > NOW());

CREATE POLICY "2fa_update_v32"
ON public.two_factor_codes FOR UPDATE
USING (user_id = auth.uid() AND expires_at > NOW() AND verified = false);

-- 5. NOTIFICATIONS: Sanitização de dados sensíveis
CREATE OR REPLACE FUNCTION public.sanitize_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NOT NULL THEN
    NEW.title := REGEXP_REPLACE(NEW.title, '\d{3}\.\d{3}\.\d{3}-\d{2}', '***', 'g');
  END IF;
  IF NEW.message IS NOT NULL THEN
    NEW.message := REGEXP_REPLACE(NEW.message, '\d{3}\.\d{3}\.\d{3}-\d{2}', '***', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sanitize_notification_trigger ON public.notifications;
CREATE TRIGGER sanitize_notification_trigger
BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.sanitize_notification();

-- 6. TEAM CHAT: Privacidade (sender_id não user_id)
ALTER TABLE public.team_chat_messages 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_users UUID[] DEFAULT NULL;

DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_read_access" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_read_v3" ON public.team_chat_messages;

CREATE POLICY "team_chat_read_v32"
ON public.team_chat_messages FOR SELECT
USING (
  is_private = false 
  OR sender_id = auth.uid()
  OR auth.uid() = ANY(COALESCE(allowed_users, ARRAY[]::UUID[]))
  OR public.is_admin_or_owner(auth.uid())
);

-- 7. ANALYTICS: Validação reforçada
DROP POLICY IF EXISTS "Validated analytics insert" ON public.analytics_metrics;
DROP POLICY IF EXISTS "analytics_insert_validated" ON public.analytics_metrics;
DROP POLICY IF EXISTS "analytics_insert_v3" ON public.analytics_metrics;

CREATE POLICY "analytics_insert_v32"
ON public.analytics_metrics FOR INSERT
WITH CHECK (
  metric_type IN ('page_view', 'pageview', 'click', 'scroll', 'session', 'event', 'error')
  AND (page_path IS NULL OR LENGTH(page_path) <= 500)
  AND (visitor_id IS NULL OR LENGTH(visitor_id) <= 100)
);

-- 8. Função de verificação de acesso a anexos
CREATE OR REPLACE FUNCTION public.can_access_attachment(p_entity_type TEXT, p_entity_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_owner(auth.uid()) THEN RETURN TRUE; END IF;
  
  CASE p_entity_type
    WHEN 'task' THEN
      RETURN EXISTS (SELECT 1 FROM public.calendar_tasks WHERE id::TEXT = p_entity_id AND user_id = auth.uid());
    WHEN 'aluno' THEN
      RETURN EXISTS (SELECT 1 FROM public.alunos WHERE id::TEXT = p_entity_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()));
    ELSE
      RETURN public.is_admin_or_owner(auth.uid());
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Job de limpeza de segurança
CREATE OR REPLACE FUNCTION public.security_cleanup_job()
RETURNS void AS $$
BEGIN
  DELETE FROM public.two_factor_codes WHERE expires_at < NOW() - INTERVAL '1 day';
  UPDATE public.activity_log SET ip_address = 'anonymized', user_agent = 'anonymized'
  WHERE created_at < NOW() - INTERVAL '90 days' AND ip_address IS NOT NULL AND ip_address != 'anonymized';
  DELETE FROM public.user_sessions WHERE is_active = false AND logout_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_v32 ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_v32 ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_2fa_codes_valid_v32 ON public.two_factor_codes(user_id, expires_at) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_team_chat_private_v32 ON public.team_chat_messages(is_private, created_at DESC) WHERE is_private = true;