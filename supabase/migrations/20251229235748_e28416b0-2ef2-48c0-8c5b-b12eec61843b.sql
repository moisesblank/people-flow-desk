-- Dropar função existente para recriar com tipo de retorno correto
DROP FUNCTION IF EXISTS public.force_logout_other_sessions(TEXT);

-- Recriar função com 'payload' em vez de 'metadata'
CREATE OR REPLACE FUNCTION public.force_logout_other_sessions(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_sessions_revoked INT := 0;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(_email);
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Usuário não encontrado'
    );
  END IF;
  
  -- Revogar todas as sessões ativas do usuário
  UPDATE active_sessions
  SET 
    status = 'revoked',
    revoked_at = NOW(),
    revoked_reason = 'force_logout_other_sessions'
  WHERE user_id = v_user_id
    AND status = 'active';
  
  GET DIAGNOSTICS v_sessions_revoked = ROW_COUNT;
  
  -- Registrar evento de segurança (usando 'payload' em vez de 'metadata')
  INSERT INTO security_events (
    event_type,
    severity,
    source,
    user_id,
    description,
    payload
  ) VALUES (
    'FORCE_LOGOUT_ALL',
    'high',
    'auth',
    v_user_id,
    'Usuário forçou logout de todas as sessões via login',
    jsonb_build_object(
      'sessions_revoked', v_sessions_revoked,
      'triggered_at', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'sessions_revoked', v_sessions_revoked,
    'message', 'Sessões encerradas com sucesso'
  );
END;
$$;

-- Garantir permissões para anon e authenticated
GRANT EXECUTE ON FUNCTION public.force_logout_other_sessions(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.force_logout_other_sessions(TEXT) TO authenticated;