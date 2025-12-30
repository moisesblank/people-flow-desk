-- P0-FIX: invalidate_session não funcionava porque auth.uid() era NULL após signOut
-- SOLUÇÃO: Buscar por session_token diretamente, não depender de auth.uid()

CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_token text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Pegar user_id da sessão via token (não depender de auth.uid() que pode ser NULL pós-signOut)
  IF p_session_token IS NOT NULL THEN
    SELECT user_id INTO v_user_id
    FROM public.active_sessions
    WHERE session_token = p_session_token
    LIMIT 1;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- Se não encontrou usuário, retornar false
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1) Invalidar user_sessions (legado / observabilidade)
  IF p_session_token IS NOT NULL THEN
    UPDATE public.user_sessions
    SET is_active = false, logout_at = NOW()
    WHERE session_token = p_session_token
      AND user_id = v_user_id;
  ELSE
    UPDATE public.user_sessions
    SET is_active = false, logout_at = NOW()
    WHERE user_id = v_user_id
      AND is_active = true;
  END IF;

  -- 2) DOGMA I (ativo): revogar a sessão específica OU todas do usuário
  IF p_session_token IS NOT NULL THEN
    UPDATE public.active_sessions
    SET status = 'revoked',
        revoked_at = NOW(),
        revoked_reason = 'user_logout'
    WHERE session_token = p_session_token
      AND status = 'active';
  ELSE
    UPDATE public.active_sessions
    SET status = 'revoked',
        revoked_at = NOW(),
        revoked_reason = 'user_logout'
    WHERE user_id = v_user_id
      AND status = 'active';
  END IF;

  -- 3) Atualizar profile
  UPDATE public.profiles
  SET is_online = false
  WHERE id = v_user_id;

  -- 4) Log
  INSERT INTO public.activity_log (user_id, action)
  VALUES (v_user_id, 'SESSION_INVALIDATED');

  RETURN true;
END;
$$;