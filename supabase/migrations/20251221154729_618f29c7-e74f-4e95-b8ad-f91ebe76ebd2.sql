-- ============================================
-- 🛡️ EVANGELHO DA SEGURANÇA v2.0
-- DOGMA I: SACRAMENTO DA SESSÃO ÚNICA
-- DOGMA II: LITURGIA DO ACESSO MÍNIMO (RLS)
-- ============================================

-- ============================================
-- DOGMA I: SESSÃO ÚNICA - FORTALECIMENTO
-- ============================================

-- 1.1 Adicionar coluna session_token única para validação
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS session_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- 1.2 Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;

-- 1.3 Função para validar sessão (retorna true se válida)
CREATE OR REPLACE FUNCTION public.validate_session_token(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN := false;
  v_user_id UUID;
BEGIN
  -- Buscar sessão ativa com este token
  SELECT user_id INTO v_user_id
  FROM public.user_sessions
  WHERE session_token = p_session_token
    AND is_active = true
    AND user_id = auth.uid()
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Atualizar last_activity
    UPDATE public.user_sessions
    SET last_activity_at = NOW()
    WHERE session_token = p_session_token;
    
    v_is_valid := true;
  END IF;
  
  RETURN v_is_valid;
END;
$$;

-- 1.4 Função melhorada para criar nova sessão (invalida todas anteriores)
CREATE OR REPLACE FUNCTION public.create_single_session(
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT 'desktop',
  _browser TEXT DEFAULT NULL,
  _os TEXT DEFAULT NULL
)
RETURNS TABLE(session_id UUID, session_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_session_token TEXT;
  v_invalidated_count INTEGER;
BEGIN
  -- Gerar token único
  v_session_token := encode(gen_random_bytes(32), 'hex');
  
  -- DOGMA I: Invalidar TODAS as sessões anteriores deste usuário
  UPDATE public.user_sessions
  SET is_active = false, logout_at = NOW()
  WHERE user_id = auth.uid() AND is_active = true;
  
  GET DIAGNOSTICS v_invalidated_count = ROW_COUNT;
  
  -- Criar nova sessão única
  INSERT INTO public.user_sessions (
    user_id, ip_address, user_agent, device_type, browser, os, session_token
  )
  VALUES (auth.uid(), _ip_address, _user_agent, _device_type, _browser, _os, v_session_token)
  RETURNING id INTO v_session_id;
  
  -- Atualizar profile
  UPDATE public.profiles
  SET last_login_at = NOW(), last_activity_at = NOW(), is_online = true
  WHERE id = auth.uid();
  
  -- Log de segurança
  INSERT INTO public.activity_log (user_id, action, new_value)
  VALUES (auth.uid(), 'SINGLE_SESSION_LOGIN', jsonb_build_object(
    'session_id', v_session_id,
    'sessions_invalidated', v_invalidated_count,
    'device', _device_type,
    'browser', _browser,
    'ip_masked', CASE WHEN _ip_address IS NOT NULL THEN 'xxx.xxx.' || split_part(_ip_address, '.', 3) || '.' || split_part(_ip_address, '.', 4) ELSE NULL END
  ));
  
  RETURN QUERY SELECT v_session_id, v_session_token;
END;
$$;

-- 1.5 Função para invalidar sessão específica (logout)
CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_token TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_session_token IS NOT NULL THEN
    -- Invalidar sessão específica
    UPDATE public.user_sessions
    SET is_active = false, logout_at = NOW()
    WHERE session_token = p_session_token AND user_id = auth.uid();
  ELSE
    -- Invalidar todas as sessões do usuário
    UPDATE public.user_sessions
    SET is_active = false, logout_at = NOW()
    WHERE user_id = auth.uid() AND is_active = true;
  END IF;
  
  -- Atualizar profile
  UPDATE public.profiles
  SET is_online = false
  WHERE id = auth.uid();
  
  -- Log
  INSERT INTO public.activity_log (user_id, action)
  VALUES (auth.uid(), 'SESSION_INVALIDATED');
  
  RETURN true;
END;
$$;

-- ============================================
-- DOGMA II: RLS FORTALECIDO
-- ============================================

-- 2.1 Função helper para verificar role de forma segura
CREATE OR REPLACE FUNCTION public.get_user_role_secure(_user_id UUID DEFAULT auth.uid())
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 2.2 Função para verificar se usuário tem permissão em área específica
CREATE OR REPLACE FUNCTION public.has_area_permission(_user_id UUID, _area TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE get_user_role_secure(_user_id)
    WHEN 'owner' THEN true
    WHEN 'admin' THEN _area NOT IN ('god_mode', 'personal_finance')
    WHEN 'contabilidade' THEN _area IN ('financeiro', 'contabilidade', 'relatorios')
    WHEN 'coordenacao' THEN _area IN ('alunos', 'cursos', 'equipe')
    WHEN 'employee' THEN _area IN ('tarefas', 'ponto', 'perfil')
    ELSE false
  END
$$;

-- 2.3 Política RLS fortalecida para user_sessions
DROP POLICY IF EXISTS "session_single_user_only" ON public.user_sessions;
CREATE POLICY "session_single_user_only" ON public.user_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_owner(auth.uid()))
  WITH CHECK (user_id = auth.uid());

-- 2.4 Tabela de logs de tentativas de acesso suspeitas
CREATE TABLE IF NOT EXISTS public.security_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  attempted_resource TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  blocked BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_access_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_attempts_owner_only" ON public.security_access_attempts
  FOR SELECT TO authenticated
  USING (is_owner(auth.uid()));

CREATE POLICY "security_attempts_insert" ON public.security_access_attempts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2.5 Função para logar tentativa de acesso bloqueada
CREATE OR REPLACE FUNCTION public.log_blocked_access(
  p_resource TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_access_attempts (user_id, attempted_resource, ip_address, reason)
  VALUES (auth.uid(), p_resource, p_ip, p_reason)
  RETURNING id INTO v_log_id;
  
  -- Criar alerta se houver muitas tentativas
  IF (SELECT COUNT(*) FROM public.security_access_attempts 
      WHERE user_id = auth.uid() AND created_at > NOW() - INTERVAL '1 hour') > 5 THEN
    INSERT INTO public.alertas_sistema (tipo, titulo, mensagem, origem, destinatarios, dados)
    VALUES (
      'seguranca',
      '⚠️ Múltiplas tentativas de acesso bloqueadas',
      'Usuário teve mais de 5 tentativas de acesso bloqueadas na última hora',
      'security_system',
      '["owner"]'::jsonb,
      jsonb_build_object('user_id', auth.uid(), 'last_resource', p_resource)
    );
  END IF;
  
  RETURN v_log_id;
END;
$$;

-- 2.6 Índices para performance em RLS
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_security_attempts_user ON public.security_access_attempts(user_id, created_at DESC);

-- ============================================
-- LIMPEZA DE POLÍTICAS DUPLICADAS
-- ============================================

-- Remover políticas duplicadas que podem causar conflitos
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Log início da limpeza
  RAISE NOTICE 'Iniciando limpeza de segurança DOGMA I e II...';
END $$;