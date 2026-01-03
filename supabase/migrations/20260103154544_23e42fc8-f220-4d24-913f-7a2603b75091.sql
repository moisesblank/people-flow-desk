-- ============================================
-- FIX: check_active_session_exists verifica por session_token
-- Se o _device_hash fornecido for um UUID válido E corresponder
-- ao session_token da sessão ativa, é o MESMO dispositivo
-- ============================================

DROP FUNCTION IF EXISTS public.check_active_session_exists(text, text);

CREATE OR REPLACE FUNCTION public.check_active_session_exists(_email text, _session_token text DEFAULT NULL)
 RETURNS TABLE(has_active_session boolean, device_name text, device_type text, last_activity_at timestamp with time zone, is_same_device boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _session_record RECORD;
BEGIN
  -- Buscar usuário pelo email
  SELECT au.id INTO _user_id FROM auth.users au WHERE LOWER(au.email) = LOWER(_email);
  
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;
  
  -- Buscar sessão ativa mais recente
  SELECT s.device_name, s.device_type, s.last_activity_at, s.session_token
  INTO _session_record
  FROM public.active_sessions s
  WHERE s.user_id = _user_id AND s.status = 'active' AND s.expires_at > now()
  ORDER BY s.created_at DESC 
  LIMIT 1;
  
  IF _session_record IS NULL THEN
    -- Sem sessão ativa = pode logar
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, FALSE;
    RETURN;
  END IF;
  
  -- 🔐 FIX: Verificar se é o MESMO DISPOSITIVO pelo session_token
  -- Se _session_token foi fornecido E é igual ao token da sessão ativa,
  -- significa que este navegador tem o token local da sessão atual
  -- (ou seja, é o MESMO dispositivo tentando re-logar)
  IF _session_token IS NOT NULL AND _session_record.session_token::TEXT = _session_token THEN
    RETURN QUERY SELECT 
      TRUE,  -- has_active_session
      _session_record.device_name, 
      _session_record.device_type, 
      _session_record.last_activity_at,
      TRUE;  -- is_same_device = mesmo navegador/dispositivo com token local
    RETURN;
  END IF;
  
  -- Sessão ativa em OUTRO dispositivo (não tem o token local) = bloquear
  RETURN QUERY SELECT 
    TRUE,  -- has_active_session
    _session_record.device_name, 
    _session_record.device_type, 
    _session_record.last_activity_at,
    FALSE; -- is_same_device = dispositivo diferente, precisa forçar logout
END;
$function$;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.check_active_session_exists(text, text) IS 'Verifica sessão ativa antes do login. Se _session_token corresponde ao token da sessão ativa, retorna is_same_device=TRUE (mesmo navegador). Caso contrário, is_same_device=FALSE (precisa forçar logout).';