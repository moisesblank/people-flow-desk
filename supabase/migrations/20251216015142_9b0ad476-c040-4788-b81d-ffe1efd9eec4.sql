-- Tabela para códigos 2FA
CREATE TABLE public.two_factor_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Habilitar RLS
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem seus próprios códigos
CREATE POLICY "Users can view own 2FA codes"
ON public.two_factor_codes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: sistema pode inserir códigos
CREATE POLICY "System can insert 2FA codes"
ON public.two_factor_codes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política: usuários podem atualizar seus códigos (verificar)
CREATE POLICY "Users can update own 2FA codes"
ON public.two_factor_codes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Índice para busca rápida
CREATE INDEX idx_2fa_user_code ON public.two_factor_codes(user_id, code, expires_at);

-- Função para gerar código 2FA
CREATE OR REPLACE FUNCTION public.generate_2fa_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Função para verificar código 2FA
CREATE OR REPLACE FUNCTION public.verify_2fa_code(p_code VARCHAR(6))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN := false;
BEGIN
  -- Verificar se código existe, não expirou e não foi usado
  SELECT true INTO v_valid
  FROM public.two_factor_codes
  WHERE user_id = auth.uid()
    AND code = p_code
    AND expires_at > NOW()
    AND verified = false
  LIMIT 1;

  IF v_valid THEN
    -- Marcar código como usado
    UPDATE public.two_factor_codes
    SET verified = true
    WHERE user_id = auth.uid() AND code = p_code;
    
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Função para limpar códigos antigos
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.two_factor_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;