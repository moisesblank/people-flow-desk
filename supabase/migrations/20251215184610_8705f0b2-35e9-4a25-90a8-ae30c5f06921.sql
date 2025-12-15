-- ====================================
-- SYNAPSE v14.0 - FASE 0: MONITORAMENTO DE SESSÕES
-- ====================================

-- 1. Adicionar colunas de tracking na profiles (se não existirem)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity_at DESC);

-- 2. Tabela de sessões de login
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  os TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_login ON public.user_sessions(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.user_sessions(is_active);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_sessions
DROP POLICY IF EXISTS "users_view_own_sessions" ON public.user_sessions;
CREATE POLICY "users_view_own_sessions" ON public.user_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "system_insert_sessions" ON public.user_sessions;
CREATE POLICY "system_insert_sessions" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_sessions" ON public.user_sessions;
CREATE POLICY "users_update_own_sessions" ON public.user_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 3. Tabela de log de atividades (auditoria)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_log(action);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_insert_only" ON public.activity_log;
CREATE POLICY "activity_insert_only" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "owner_read_activity" ON public.activity_log;
CREATE POLICY "owner_read_activity" ON public.activity_log
  FOR SELECT TO authenticated USING (public.is_owner() OR user_id = auth.uid());

-- 4. Função: Registrar login
CREATE OR REPLACE FUNCTION public.register_user_login(
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT 'desktop',
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _session_id UUID;
BEGIN
  -- Criar nova sessão
  INSERT INTO public.user_sessions (user_id, ip_address, user_agent, device_type, browser, os)
  VALUES (auth.uid(), _ip_address, _user_agent, _device_type, _browser, _os)
  RETURNING id INTO _session_id;
  
  -- Atualizar profile
  UPDATE public.profiles
  SET last_login_at = NOW(), last_activity_at = NOW(), is_online = true
  WHERE id = auth.uid();
  
  -- Desativar sessões antigas do mesmo usuário
  UPDATE public.user_sessions
  SET is_active = false, logout_at = NOW()
  WHERE user_id = auth.uid() AND id != _session_id AND is_active = true;
  
  -- Log de atividade
  INSERT INTO public.activity_log (user_id, action, new_value)
  VALUES (auth.uid(), 'LOGIN', jsonb_build_object('session_id', _session_id, 'device', _device_type, 'browser', _browser));
  
  RETURN _session_id;
END;
$$;

-- 5. Função: Atualizar atividade
CREATE OR REPLACE FUNCTION public.update_user_activity()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_activity_at = NOW(), is_online = true 
  WHERE id = auth.uid();
  
  UPDATE public.user_sessions 
  SET last_activity_at = NOW() 
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$;

-- 6. Função: Registrar logout
CREATE OR REPLACE FUNCTION public.register_user_logout()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false, logout_at = NOW() 
  WHERE user_id = auth.uid() AND is_active = true;
  
  UPDATE public.profiles 
  SET is_online = false 
  WHERE id = auth.uid();
  
  INSERT INTO public.activity_log (user_id, action)
  VALUES (auth.uid(), 'LOGOUT');
END;
$$;

-- 7. Função: OWNER vê todos os acessos
CREATE OR REPLACE FUNCTION public.get_all_users_last_access()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_online BOOLEAN,
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  status_atividade TEXT,
  ultima_sessao JSONB
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Acesso negado: apenas o OWNER pode ver todos os acessos';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.nome as full_name,
    p.avatar_url,
    COALESCE(p.is_online, false) as is_online,
    p.last_login_at,
    p.last_activity_at,
    CASE 
      WHEN COALESCE(p.is_online, false) = true AND p.last_activity_at > NOW() - INTERVAL '5 minutes' THEN 'Online'
      WHEN p.last_activity_at > NOW() - INTERVAL '5 minutes' THEN 'Recente'
      WHEN p.last_activity_at > NOW() - INTERVAL '1 hour' THEN 'Há pouco'
      WHEN p.last_activity_at > NOW() - INTERVAL '1 day' THEN 'Hoje'
      WHEN p.last_activity_at IS NOT NULL THEN 'Inativo'
      ELSE 'Nunca acessou'
    END as status_atividade,
    (SELECT jsonb_build_object(
      'ip', s.ip_address, 
      'device', s.device_type, 
      'browser', s.browser,
      'os', s.os,
      'login_at', s.login_at
    )
     FROM public.user_sessions s 
     WHERE s.user_id = p.id 
     ORDER BY s.login_at DESC 
     LIMIT 1) as ultima_sessao
  FROM public.profiles p
  ORDER BY p.last_activity_at DESC NULLS LAST;
END;
$$;

-- 8. Função: Log de atividade genérico
CREATE OR REPLACE FUNCTION public.log_activity(
  _action TEXT,
  _table_name TEXT DEFAULT NULL,
  _record_id TEXT DEFAULT NULL,
  _old_value JSONB DEFAULT NULL,
  _new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE 
  _log_id UUID;
  _user_email TEXT;
BEGIN
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  
  INSERT INTO public.activity_log (user_id, user_email, action, table_name, record_id, old_value, new_value)
  VALUES (auth.uid(), _user_email, _action, _table_name, _record_id, _old_value, _new_value)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;