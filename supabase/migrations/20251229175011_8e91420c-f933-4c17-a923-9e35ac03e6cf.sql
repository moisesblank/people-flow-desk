-- Criar função que apenas valida (sem consumir)
CREATE OR REPLACE FUNCTION public.check_password_reset_token(_token text)
RETURNS TABLE(user_id uuid, email text, valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Buscar token válido (não usado e não expirado) - SEM MARCAR COMO USADO
  SELECT prt.user_id, prt.email INTO v_user_id, v_email
  FROM password_reset_tokens prt
  WHERE prt.token = _token 
    AND prt.used_at IS NULL 
    AND prt.expires_at > now();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Retorna válido SEM consumir
  RETURN QUERY SELECT v_user_id, v_email, TRUE;
END;
$function$;

-- Atualizar validate para ser explicitamente "consumir e validar"
CREATE OR REPLACE FUNCTION public.consume_password_reset_token(_token text)
RETURNS TABLE(user_id uuid, email text, valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Buscar token válido
  SELECT prt.user_id, prt.email INTO v_user_id, v_email
  FROM password_reset_tokens prt
  WHERE prt.token = _token 
    AND prt.used_at IS NULL 
    AND prt.expires_at > now();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Marcar como usado AGORA
  UPDATE password_reset_tokens 
  SET used_at = now() 
  WHERE token = _token;
  
  RETURN QUERY SELECT v_user_id, v_email, TRUE;
END;
$function$;

-- Resetar o token da bruna para testar de novo
UPDATE password_reset_tokens 
SET used_at = NULL 
WHERE user_id = '9fd68493-3dae-44c1-9165-e1e654470987'
AND token = '1e5XHqmSyLqQXrWcZrZn2KtRDZ8kPRym6UlAoNIHlaE';