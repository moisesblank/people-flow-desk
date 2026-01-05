-- 🔧 P0 FIX: Corrigir erro "uuid = text" na fortress_session_validate
-- session_token é UUID no banco mas parâmetro é TEXT

DROP FUNCTION IF EXISTS public.fortress_session_validate(text);

CREATE OR REPLACE FUNCTION public.fortress_session_validate(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_session RECORD; 
  v_now TIMESTAMPTZ := now();
  v_session_token_uuid UUID;
BEGIN
  -- Cast explícito de TEXT para UUID
  BEGIN
    v_session_token_uuid := p_session_token::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_token_format');
  END;

  SELECT * INTO v_session FROM public.active_sessions WHERE session_token = v_session_token_uuid;
  
  IF v_session IS NULL THEN 
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found'); 
  END IF;
  
  IF v_session.status != 'active' THEN 
    RETURN jsonb_build_object('valid', false, 'reason', v_session.status); 
  END IF;
  
  IF v_session.expires_at < v_now THEN 
    UPDATE public.active_sessions SET status = 'expired' WHERE id = v_session.id; 
    RETURN jsonb_build_object('valid', false, 'reason', 'expired'); 
  END IF;
  
  UPDATE public.active_sessions SET last_activity_at = v_now WHERE id = v_session.id;
  
  RETURN jsonb_build_object('valid', true, 'user_id', v_session.user_id, 'device_hash', v_session.device_hash);
END; 
$$;

GRANT EXECUTE ON FUNCTION public.fortress_session_validate(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fortress_session_validate(TEXT) TO anon;