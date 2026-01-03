-- ============================================
-- FIX: Dropar função antiga e criar nova versão
-- check_active_session_exists agora recebe device_hash opcional
-- ============================================

-- Dropar função antiga (com assinatura específica)
DROP FUNCTION IF EXISTS public.check_active_session_exists(text);

-- Criar nova versão com device_hash opcional
CREATE OR REPLACE FUNCTION public.check_active_session_exists(_email text, _device_hash text DEFAULT NULL)
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
  SELECT s.device_name, s.device_type, s.last_activity_at, s.device_hash
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
  
  -- 🔐 FIX: Verificar se é o MESMO DISPOSITIVO
  -- Se _device_hash foi fornecido E é igual ao da sessão ativa, 
  -- retornamos is_same_device = TRUE para o frontend saber que pode prosseguir
  IF _device_hash IS NOT NULL AND _session_record.device_hash = _device_hash THEN
    RETURN QUERY SELECT 
      TRUE,  -- has_active_session
      _session_record.device_name, 
      _session_record.device_type, 
      _session_record.last_activity_at,
      TRUE;  -- is_same_device = mesma máquina, pode substituir sessão
    RETURN;
  END IF;
  
  -- Sessão ativa em OUTRO dispositivo = bloquear
  RETURN QUERY SELECT 
    TRUE,  -- has_active_session
    _session_record.device_name, 
    _session_record.device_type, 
    _session_record.last_activity_at,
    FALSE; -- is_same_device = dispositivo diferente, precisa forçar logout
END;
$function$;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.check_active_session_exists(text, text) IS 'Verifica sessão ativa antes do login. Retorna is_same_device=TRUE se a sessão ativa é do mesmo dispositivo (pode substituir). is_same_device=FALSE se é de outro dispositivo (precisa forçar logout).';