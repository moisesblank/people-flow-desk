
-- ============================================
-- FIX: Remover overload conflitante (manter apenas TEXT)
-- ============================================

DROP FUNCTION IF EXISTS public.validate_session_token(UUID);

-- Garantir que a versão TEXT está correta
CREATE OR REPLACE FUNCTION public.validate_session_token(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _session_record RECORD;
  _current_epoch INTEGER;
  _token_uuid UUID;
BEGIN
  -- Converter TEXT para UUID
  BEGIN
    _token_uuid := p_session_token::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN FALSE;
  END;

  SELECT * INTO _session_record
  FROM public.active_sessions
  WHERE session_token = _token_uuid AND status = 'active' AND expires_at > now();
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  SELECT auth_epoch INTO _current_epoch FROM public.system_guard LIMIT 1;
  IF _session_record.auth_epoch_at_login < COALESCE(_current_epoch, 1) THEN
    UPDATE public.active_sessions SET status = 'revoked', revoked_at = now(), revoked_reason = 'epoch_expired' WHERE id = _session_record.id;
    RETURN FALSE;
  END IF;
  
  UPDATE public.active_sessions SET last_activity_at = now() WHERE id = _session_record.id;
  RETURN TRUE;
END;
$$;
