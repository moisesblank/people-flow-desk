-- Tabela para tokens de reset de senha customizado
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- RLS: Apenas funções podem acessar (via SECURITY DEFINER)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Função para criar token de reset (chamada pela edge function)
CREATE OR REPLACE FUNCTION public.create_password_reset_token(_email TEXT)
RETURNS TABLE(token TEXT, user_id UUID, expires_at TIMESTAMP WITH TIME ZONE) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(_email);
  
  IF v_user_id IS NULL THEN
    -- Não revelar se email existe ou não (segurança)
    RETURN;
  END IF;
  
  -- Invalidar tokens anteriores desse email
  UPDATE password_reset_tokens 
  SET used_at = now() 
  WHERE LOWER(email) = LOWER(_email) AND used_at IS NULL;
  
  -- Gerar novo token (URL-safe)
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  
  -- Expira em 1 hora
  v_expires := now() + interval '1 hour';
  
  -- Inserir token
  INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
  VALUES (v_user_id, _email, v_token, v_expires);
  
  RETURN QUERY SELECT v_token, v_user_id, v_expires;
END;
$$;

-- Função para validar e consumir token
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(_token TEXT)
RETURNS TABLE(user_id UUID, email TEXT, valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Buscar token válido (não usado e não expirado)
  SELECT prt.user_id, prt.email INTO v_user_id, v_email
  FROM password_reset_tokens prt
  WHERE prt.token = _token 
    AND prt.used_at IS NULL 
    AND prt.expires_at > now();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Marcar como usado
  UPDATE password_reset_tokens 
  SET used_at = now() 
  WHERE token = _token;
  
  RETURN QUERY SELECT v_user_id, v_email, TRUE;
END;
$$;