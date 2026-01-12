-- ============================================
-- 🛡️ P0-1: RPC REVOKE SESSION ON VIOLATION
-- Revoga sessão imediatamente quando violação severa é detectada
-- Inclui broadcast Realtime para logout instantâneo
-- ============================================

-- Função para revogar sessão por violação de segurança
CREATE OR REPLACE FUNCTION public.revoke_session_on_violation(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'security_violation',
  p_violation_type TEXT DEFAULT 'unknown',
  p_auto_ban BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_token UUID;
  v_sessions_deleted INTEGER;
  v_user_email TEXT;
BEGIN
  -- 1. Obter email do usuário para log
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- 2. OWNER BYPASS: Nunca revogar sessão do Owner
  IF v_user_email IS NOT NULL AND LOWER(v_user_email) = 'moisesblank@gmail.com' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OWNER_BYPASS',
      'message', 'Owner não pode ser revogado por violação'
    );
  END IF;
  
  -- 3. Obter token da sessão ativa (para broadcast)
  SELECT session_token INTO v_session_token
  FROM active_sessions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
  
  -- 4. DELETE físico de TODAS as sessões do usuário
  DELETE FROM active_sessions
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_sessions_deleted = ROW_COUNT;
  
  -- 5. Broadcast Realtime para logout instantâneo
  IF v_session_token IS NOT NULL THEN
    PERFORM pg_notify(
      'session-revoked',
      json_build_object(
        'user_id', p_user_id,
        'session_token', v_session_token,
        'reason', p_reason,
        'violation_type', p_violation_type,
        'revoked_at', NOW()
      )::text
    );
  END IF;
  
  -- 6. Auto-ban se solicitado (5+ violações)
  IF p_auto_ban THEN
    UPDATE profiles
    SET is_banned = TRUE,
        banned_at = NOW(),
        banned_reason = 'Auto-ban por violações repetidas: ' || p_violation_type
    WHERE id = p_user_id;
  END IF;
  
  -- 7. Registrar evento de segurança
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'SESSION_REVOKED_BY_VIOLATION',
    'error',
    'Sessão revogada por violação de segurança: ' || p_violation_type,
    jsonb_build_object(
      'reason', p_reason,
      'violation_type', p_violation_type,
      'sessions_deleted', v_sessions_deleted,
      'auto_banned', p_auto_ban,
      'user_email', v_user_email
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'sessions_deleted', v_sessions_deleted,
    'auto_banned', p_auto_ban,
    'message', 'Sessão revogada com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Permissão para usuários autenticados chamarem
GRANT EXECUTE ON FUNCTION public.revoke_session_on_violation TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_session_on_violation TO service_role;

COMMENT ON FUNCTION public.revoke_session_on_violation IS 'P0-1: Revoga sessão imediatamente quando violação de segurança é detectada. Inclui broadcast Realtime e opção de auto-ban.';