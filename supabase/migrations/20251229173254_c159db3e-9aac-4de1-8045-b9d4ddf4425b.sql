-- ============================================
-- 🔒 SESSÃO ÚNICA GLOBAL - MODO BLOQUEIO v1.0
-- Constituição SYNAPSE Ω v10.0 - DOGMA I
-- UM USUÁRIO = UMA SESSÃO = ZERO EXCEÇÕES
-- ============================================

-- Função para verificar se já existe sessão ativa para o usuário
CREATE OR REPLACE FUNCTION public.check_active_session_exists(_email TEXT)
RETURNS TABLE (
  has_active_session BOOLEAN,
  device_name TEXT,
  device_type TEXT,
  last_activity_at TIMESTAMPTZ,
  session_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(_email);
  
  IF _user_id IS NULL THEN
    -- Usuário não existe, pode criar sessão
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Verificar se existe sessão ativa não expirada
  RETURN QUERY
  SELECT 
    TRUE,
    s.device_name,
    s.device_type,
    s.last_activity_at,
    s.created_at
  FROM public.active_sessions s
  WHERE s.user_id = _user_id
    AND s.status = 'active'
    AND s.expires_at > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Se não encontrou nenhuma sessão ativa
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- Função para forçar encerramento de sessões anteriores (para uso no "Encerrar outras sessões")
CREATE OR REPLACE FUNCTION public.force_logout_other_sessions(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _affected INTEGER;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(_email);
  
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Revogar todas as sessões ativas do usuário
  UPDATE public.active_sessions
  SET 
    status = 'revoked',
    revoked_at = now(),
    revoked_reason = 'forced_logout_by_user'
  WHERE user_id = _user_id AND status = 'active';
  
  GET DIAGNOSTICS _affected = ROW_COUNT;
  
  -- Log de auditoria
  INSERT INTO public.audit_logs (action, user_id, metadata)
  VALUES (
    'FORCE_LOGOUT_OTHER_SESSIONS',
    _user_id,
    jsonb_build_object(
      'sessions_revoked', _affected,
      'email', _email,
      'timestamp', now()
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Conceder permissões para funções anônimas e autenticadas
GRANT EXECUTE ON FUNCTION public.check_active_session_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_active_session_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_logout_other_sessions(TEXT) TO authenticated;