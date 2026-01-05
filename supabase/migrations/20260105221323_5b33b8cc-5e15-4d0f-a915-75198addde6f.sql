-- ============================================
-- INACTIVITY TIMEOUT: 12 HORAS
-- Sessão é invalidada se last_activity_at > 12h
-- ============================================

-- Atualiza a função validate_session_epoch para incluir verificação de inatividade
CREATE OR REPLACE FUNCTION public.validate_session_epoch(p_session_token TEXT)
RETURNS TABLE(is_valid BOOLEAN, reason TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_system_guard RECORD;
  v_inactivity_hours CONSTANT INTEGER := 12; -- TIMEOUT DE INATIVIDADE
BEGIN
  -- 1. Buscar sessão
  SELECT s.*, 
         EXTRACT(EPOCH FROM (NOW() - s.last_activity_at)) / 3600 AS hours_inactive
  INTO v_session
  FROM active_sessions s
  WHERE s.session_token = p_session_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'SESSION_NOT_FOUND'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 2. Verificar status
  IF v_session.status != 'active' THEN
    RETURN QUERY SELECT FALSE, 'SESSION_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 3. Verificar expiração normal
  IF v_session.expires_at < NOW() THEN
    -- Revogar sessão expirada
    UPDATE active_sessions 
    SET status = 'revoked', 
        revoked_at = NOW(), 
        revoked_reason = 'session_expired'
    WHERE session_token = p_session_token;
    
    RETURN QUERY SELECT FALSE, 'SESSION_EXPIRED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 4. ✨ NOVO: Verificar INATIVIDADE (12 horas)
  IF v_session.hours_inactive > v_inactivity_hours THEN
    -- Revogar sessão por inatividade
    UPDATE active_sessions 
    SET status = 'revoked', 
        revoked_at = NOW(), 
        revoked_reason = 'inactivity_timeout'
    WHERE session_token = p_session_token;
    
    RETURN QUERY SELECT FALSE, 'INACTIVITY_TIMEOUT'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 5. Verificar system_guard (lockdown)
  SELECT auth_enabled, auth_epoch INTO v_system_guard
  FROM system_guard
  LIMIT 1;
  
  IF v_system_guard IS NOT NULL THEN
    -- Lockdown total
    IF NOT v_system_guard.auth_enabled THEN
      RETURN QUERY SELECT FALSE, 'AUTH_LOCKDOWN'::TEXT, v_session.user_id;
      RETURN;
    END IF;
    
    -- Epoch divergente
    IF v_session.auth_epoch_at_login IS NOT NULL 
       AND v_session.auth_epoch_at_login < v_system_guard.auth_epoch THEN
      RETURN QUERY SELECT FALSE, 'AUTH_EPOCH_REVOKED'::TEXT, v_session.user_id;
      RETURN;
    END IF;
  END IF;
  
  -- 6. Verificar se usuário ainda existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_session.user_id) THEN
    RETURN QUERY SELECT FALSE, 'USER_DELETED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- ✅ Sessão válida
  RETURN QUERY SELECT TRUE, 'VALID'::TEXT, v_session.user_id;
END;
$$;

-- Comentário documentando a mudança
COMMENT ON FUNCTION public.validate_session_epoch(TEXT) IS 
'Valida sessão com timeout de inatividade de 12 horas. v2.0 - 2025-01-05';