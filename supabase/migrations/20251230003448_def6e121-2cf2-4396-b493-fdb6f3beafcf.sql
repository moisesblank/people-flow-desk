-- PATCH-ONLY: Garantir que logout invalide também public.active_sessions
-- Causa: active_sessions ficava 'active' após signOut, gerando Active Session Gate mesmo no primeiro login.

CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_token text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1) Invalidar user_sessions (legado / observabilidade)
  IF p_session_token IS NOT NULL THEN
    UPDATE public.user_sessions
    SET is_active = false, logout_at = NOW()
    WHERE session_token = p_session_token
      AND user_id = auth.uid();
  ELSE
    UPDATE public.user_sessions
    SET is_active = false, logout_at = NOW()
    WHERE user_id = auth.uid()
      AND is_active = true;
  END IF;

  -- 2) DOGMA I (ativo): revogar qualquer sessão ativa (Sessão Única) ao logout
  UPDATE public.active_sessions
  SET status = 'revoked',
      revoked_at = NOW(),
      revoked_reason = 'user_logout'
  WHERE user_id = auth.uid()
    AND status = 'active';

  -- 3) Atualizar profile
  UPDATE public.profiles
  SET is_online = false
  WHERE id = auth.uid();

  -- 4) Log
  INSERT INTO public.activity_log (user_id, action)
  VALUES (auth.uid(), 'SESSION_INVALIDATED');

  RETURN true;
END;
$$;