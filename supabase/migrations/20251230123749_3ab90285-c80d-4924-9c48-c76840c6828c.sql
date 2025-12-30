-- ============================================
-- 🔐 2FA ISOLADO — TABELA DE VERIFICAÇÕES MFA
-- Independente de login/sessão/dispositivo
-- ============================================

-- Tabela para armazenar verificações MFA por ação
CREATE TABLE IF NOT EXISTS public.user_mfa_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    ip_address TEXT,
    device_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consultas rápidas por usuário + ação
CREATE INDEX IF NOT EXISTS idx_mfa_verifications_user_action 
ON public.user_mfa_verifications(user_id, action, expires_at);

-- Índice para limpeza de verificações expiradas
CREATE INDEX IF NOT EXISTS idx_mfa_verifications_expires 
ON public.user_mfa_verifications(expires_at);

-- RLS habilitado
ALTER TABLE public.user_mfa_verifications ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê suas próprias verificações
CREATE POLICY "Users can view own MFA verifications"
ON public.user_mfa_verifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: sistema pode inserir (via edge function)
CREATE POLICY "System can insert MFA verifications"
ON public.user_mfa_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: sistema pode deletar expiradas
CREATE POLICY "Users can delete own MFA verifications"
ON public.user_mfa_verifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÃO: Verificar se ação tem MFA válido
-- ============================================
CREATE OR REPLACE FUNCTION public.check_mfa_valid(
    _user_id UUID,
    _action TEXT
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
        AND action = _action
        AND expires_at > now()
    );
$$;

-- ============================================
-- FUNÇÃO: Registrar verificação MFA
-- ============================================
CREATE OR REPLACE FUNCTION public.register_mfa_verification(
    _user_id UUID,
    _action TEXT,
    _ip_address TEXT DEFAULT NULL,
    _device_hash TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _verification_id UUID;
BEGIN
    -- Remove verificações antigas da mesma ação
    DELETE FROM public.user_mfa_verifications
    WHERE user_id = _user_id AND action = _action;
    
    -- Insere nova verificação (válida por 24h)
    INSERT INTO public.user_mfa_verifications (
        user_id, 
        action, 
        verified_at, 
        expires_at,
        ip_address,
        device_hash
    )
    VALUES (
        _user_id, 
        _action, 
        now(), 
        now() + INTERVAL '24 hours',
        _ip_address,
        _device_hash
    )
    RETURNING id INTO _verification_id;
    
    RETURN _verification_id;
END;
$$;

-- ============================================
-- FUNÇÃO: Limpar verificações expiradas
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_mfa_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_mfa_verifications
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Comentário para documentação
COMMENT ON TABLE public.user_mfa_verifications IS 
'Verificações MFA independentes de login/sessão. Cada ação sensível requer verificação separada válida por 24h.';

COMMENT ON FUNCTION public.check_mfa_valid IS 
'Verifica se usuário tem MFA válido para determinada ação. Retorna TRUE se verificação existe e não expirou.';