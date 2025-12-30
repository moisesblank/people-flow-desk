-- ============================================
-- 🔐 DEVICE MFA VERIFICATION — 2FA por Dispositivo
-- Adiciona suporte para verificação vinculada ao device_hash
-- ============================================

-- Função para verificar se dispositivo tem MFA válido (24h)
CREATE OR REPLACE FUNCTION public.check_device_mfa_valid(
    _user_id UUID,
    _device_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_mfa_verifications
        WHERE user_id = _user_id
        AND action = 'device_verification'
        AND device_hash = _device_hash
        AND expires_at > now()
    );
$$;

-- Função para registrar verificação de dispositivo
CREATE OR REPLACE FUNCTION public.register_device_mfa_verification(
    _user_id UUID,
    _device_hash TEXT,
    _ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _verification_id UUID;
BEGIN
    -- Remove verificações antigas do mesmo dispositivo
    DELETE FROM public.user_mfa_verifications
    WHERE user_id = _user_id 
    AND action = 'device_verification'
    AND device_hash = _device_hash;
    
    -- Insere nova verificação (válida por 24h)
    INSERT INTO public.user_mfa_verifications (
        user_id, 
        action, 
        verified_at, 
        expires_at,
        device_hash,
        ip_address
    )
    VALUES (
        _user_id, 
        'device_verification', 
        now(), 
        now() + INTERVAL '24 hours',
        _device_hash,
        _ip_address
    )
    RETURNING id INTO _verification_id;
    
    RETURN _verification_id;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.check_device_mfa_valid IS 
'Verifica se dispositivo específico tem verificação MFA válida. Retorna TRUE se existe e não expirou.';

COMMENT ON FUNCTION public.register_device_mfa_verification IS 
'Registra verificação MFA para dispositivo específico. Válido por 24h.';