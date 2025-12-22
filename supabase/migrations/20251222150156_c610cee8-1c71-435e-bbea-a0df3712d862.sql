-- ============================================
-- 🔥 SECURITY FORTRESS - Completar (funções já criadas anteriormente ok)
-- Apenas tabelas novas + índices restantes
-- ============================================

-- ============================================
-- SECURITY AUDIT LOG (se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    session_id UUID,
    
    action TEXT NOT NULL,
    action_category TEXT NOT NULL DEFAULT 'general',
    table_name TEXT,
    record_id TEXT,
    
    old_data JSONB,
    new_data JSONB,
    
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    request_id UUID,
    correlation_id UUID,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_sec_audit_user ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_created ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_action ON public.security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_sec_audit_category ON public.security_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_sec_audit_ip ON public.security_audit_log(ip_address);

-- ============================================
-- RATE LIMIT STATE (se não existir)
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limit_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocked_until TIMESTAMPTZ,
    total_blocked_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON public.rate_limit_state(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON public.rate_limit_state(updated_at);

-- ============================================
-- FUNÇÃO is_admin_or_owner (nova, sem conflito)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin_or_owner_v2(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- RLS PARA NOVAS TABELAS
-- ============================================

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_state ENABLE ROW LEVEL SECURITY;

-- Políticas usando função existente has_role
DROP POLICY IF EXISTS "sec_audit_select" ON public.security_audit_log;
CREATE POLICY "sec_audit_select" ON public.security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "rate_limit_all" ON public.rate_limit_state;
CREATE POLICY "rate_limit_all" ON public.rate_limit_state
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION public.is_admin_or_owner_v2 IS 'Verifica se usuário é admin ou owner';
COMMENT ON TABLE public.security_audit_log IS 'Log de auditoria de segurança';
COMMENT ON TABLE public.rate_limit_state IS 'Estado do rate limiting';