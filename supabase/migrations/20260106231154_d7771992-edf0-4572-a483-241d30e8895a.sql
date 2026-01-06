-- ============================================
-- 🔐 CORREÇÃO: Trust de dispositivo para 30 dias (v11.0)
-- Atualiza de 24 horas para 30 dias conforme Constituição
-- ============================================

-- Recriar função register_device_mfa_verification com 30 dias
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
    -- Remover verificações anteriores do mesmo dispositivo
    DELETE FROM public.user_mfa_verifications
    WHERE user_id = _user_id
    AND device_hash = _device_hash
    AND action = 'device_verification';
    
    -- Inserir nova verificação com 30 DIAS de validade
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
        now() + INTERVAL '30 days',  -- ✅ CORRIGIDO: 30 dias
        _device_hash,
        _ip_address
    )
    RETURNING id INTO _verification_id;
    
    RETURN _verification_id;
END;
$$;

-- Atualizar default da coluna para novos inserts manuais
ALTER TABLE public.user_mfa_verifications 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '30 days');

-- Comentário para documentação
COMMENT ON FUNCTION public.register_device_mfa_verification IS 
'Registra verificação MFA de dispositivo com validade de 30 dias (Constituição v11.0)';