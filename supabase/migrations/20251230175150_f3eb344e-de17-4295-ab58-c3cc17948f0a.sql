-- =====================================================
-- P0 PATCH: validate_session_epoch UUID/TEXT cast seguro
-- AUTORIZADO: Opção A — manter param text, cast interno
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_session_epoch(p_session_token text)
 RETURNS TABLE(is_valid boolean, reason text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session RECORD;
  v_current_epoch INTEGER;
  v_auth_enabled BOOLEAN;
  v_user_exists BOOLEAN;
  v_profile RECORD;
  v_token_uuid UUID;
BEGIN
  -- =====================================================
  -- P0 FIX: Cast seguro de TEXT → UUID com fallback
  -- Evita erro "operator does not exist: uuid = text"
  -- =====================================================
  BEGIN
    v_token_uuid := p_session_token::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Token malformado (não é UUID válido)
    RETURN QUERY SELECT false, 'INVALID_TOKEN_FORMAT'::TEXT, NULL::UUID;
    RETURN;
  END;

  -- 1. Verificar auth_enabled primeiro (LOCKDOWN CHECK)
  SELECT auth_enabled, auth_epoch INTO v_auth_enabled, v_current_epoch
  FROM public.system_guard LIMIT 1;
  
  IF NOT COALESCE(v_auth_enabled, true) THEN
    RETURN QUERY SELECT false, 'AUTH_LOCKDOWN'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 2. Buscar sessão (agora comparando UUID = UUID)
  SELECT * INTO v_session
  FROM public.active_sessions
  WHERE session_token = v_token_uuid
    AND status = 'active';
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT false, 'SESSION_NOT_FOUND'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 3. Verificar expiração
  IF v_session.expires_at < now() THEN
    UPDATE public.active_sessions
    SET status = 'expired', revoked_at = now(), revoked_reason = 'SESSION_EXPIRED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'SESSION_EXPIRED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 4. Verificar epoch (EPOCH CHECK - CRÍTICO)
  IF COALESCE(v_session.auth_epoch_at_login, 0) != COALESCE(v_current_epoch, 1) THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'AUTH_EPOCH_REVOKED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'AUTH_EPOCH_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 5. Verificar se user existe (USER CHECK)
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_session.user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'USER_DELETED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'USER_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- 6. Verificar se user está ativo no profile (status check)
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_session.user_id;
  
  IF v_profile IS NOT NULL AND v_profile.status = 'inativo' THEN
    UPDATE public.active_sessions
    SET status = 'revoked', revoked_at = now(), revoked_reason = 'USER_DISABLED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'USER_REVOKED'::TEXT, v_session.user_id;
    RETURN;
  END IF;
  
  -- ✅ Sessão válida
  RETURN QUERY SELECT true, 'VALID'::TEXT, v_session.user_id;
END;
$function$;