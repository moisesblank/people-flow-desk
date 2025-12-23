
-- ============================================
-- 🏛️ SANCTUM SYNAPSE 3500: Funções de Segurança
-- Complemento às tabelas existentes
-- ============================================

-- ============================================
-- 1. TABELA: ena_asset_access (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ena_asset_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.ena_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_required TEXT,
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    UNIQUE(asset_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ena_asset_access_user ON public.ena_asset_access(user_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_ena_asset_access_expires ON public.ena_asset_access(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.ena_asset_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ena_asset_access_select" ON public.ena_asset_access;
CREATE POLICY "ena_asset_access_select" ON public.ena_asset_access FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

DROP POLICY IF EXISTS "ena_asset_access_admin" ON public.ena_asset_access;
CREATE POLICY "ena_asset_access_admin" ON public.ena_asset_access FOR ALL TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- ============================================
-- 2. FUNÇÃO: fn_check_premium_access (RBAC + lock)
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_check_premium_access(
    p_user_id UUID,
    p_asset_id UUID,
    p_device_hash TEXT DEFAULT NULL
) RETURNS TABLE (
    allowed BOOLEAN,
    reason TEXT,
    access_level TEXT,
    is_locked BOOLEAN,
    lock_until TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_asset RECORD;
    v_threat RECORD;
    v_access RECORD;
    v_required_roles TEXT[];
BEGIN
    -- Owner sempre tem acesso total
    IF public.is_owner(p_user_id) THEN
        RETURN QUERY SELECT true, 'owner_bypass'::TEXT, 'owner'::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Buscar asset
    SELECT * INTO v_asset FROM public.ena_assets WHERE id = p_asset_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'asset_not_found'::TEXT, NULL::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Verificar threat intelligence (bloqueio)
    SELECT * INTO v_threat FROM public.threat_intelligence 
    WHERE user_id = p_user_id 
    AND blocked_until IS NOT NULL 
    AND blocked_until > now()
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT false, 'user_blocked'::TEXT, 'blocked'::TEXT, true, v_threat.blocked_until;
        RETURN;
    END IF;

    -- Verificar acesso específico concedido
    SELECT * INTO v_access FROM public.ena_asset_access 
    WHERE asset_id = p_asset_id 
    AND user_id = p_user_id 
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());

    IF FOUND THEN
        RETURN QUERY SELECT true, 'specific_access'::TEXT, 'granted'::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Não premium = acesso livre
    IF NOT v_asset.is_premium THEN
        RETURN QUERY SELECT true, 'non_premium'::TEXT, 'public'::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Verificar roles requeridas
    v_required_roles := v_asset.required_roles;
    
    IF v_required_roles IS NULL OR array_length(v_required_roles, 1) IS NULL THEN
        -- Sem roles específicas = requer autenticação
        IF p_user_id IS NOT NULL THEN
            RETURN QUERY SELECT true, 'authenticated'::TEXT, 'authenticated'::TEXT, false, NULL::TIMESTAMPTZ;
        ELSE
            RETURN QUERY SELECT false, 'auth_required'::TEXT, 'protected'::TEXT, false, NULL::TIMESTAMPTZ;
        END IF;
        RETURN;
    END IF;

    -- Verificar se user tem alguma das roles requeridas
    IF 'beta' = ANY(v_required_roles) AND public.is_beta_or_owner(p_user_id) THEN
        RETURN QUERY SELECT true, 'beta_access'::TEXT, 'beta'::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    IF 'funcionario' = ANY(v_required_roles) AND public.is_funcionario_or_owner(p_user_id) THEN
        RETURN QUERY SELECT true, 'funcionario_access'::TEXT, 'funcionario'::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    IF 'admin' = ANY(v_required_roles) AND public.is_admin_or_owner(p_user_id) THEN
        RETURN QUERY SELECT true, 'admin_access'::TEXT, 'admin'::TEXT, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Nenhuma role match
    RETURN QUERY SELECT false, 'role_required'::TEXT, array_to_string(v_required_roles, ','), false, NULL::TIMESTAMPTZ;
END;
$$;

-- ============================================
-- 3. FUNÇÃO: fn_log_asset_access (logging forense)
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_log_asset_access(
    p_asset_id UUID,
    p_action TEXT,
    p_page_number INTEGER DEFAULT NULL,
    p_device_hash TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_asset RECORD;
    v_log_id UUID;
BEGIN
    SELECT * INTO v_asset FROM public.ena_assets WHERE id = p_asset_id;
    
    INSERT INTO public.content_access_log (
        user_id,
        content_type,
        content_id,
        content_title,
        action,
        device_hash,
        session_id,
        metadata
    ) VALUES (
        auth.uid(),
        v_asset.asset_type::TEXT,
        p_asset_id::TEXT,
        v_asset.title,
        p_action,
        p_device_hash,
        current_setting('request.headers', true)::jsonb->>'x-session-id',
        jsonb_build_object(
            'page_number', p_page_number,
            'is_premium', v_asset.is_premium
        ) || p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- ============================================
-- 4. FUNÇÃO: fn_apply_asset_violation (risk score)
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_apply_asset_violation(
    p_user_id UUID,
    p_violation_type TEXT,
    p_severity INTEGER DEFAULT 10,
    p_device_hash TEXT DEFAULT NULL
) RETURNS TABLE (
    new_score INTEGER,
    is_blocked BOOLEAN,
    blocked_until TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_current RECORD;
    v_new_score INTEGER;
    v_block_until TIMESTAMPTZ;
BEGIN
    -- Owner nunca é bloqueado
    IF public.is_owner(p_user_id) THEN
        RETURN QUERY SELECT 0, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Buscar ou criar registro
    SELECT * INTO v_current FROM public.threat_intelligence WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.threat_intelligence (user_id, device_fingerprint, risk_score, total_violations)
        VALUES (p_user_id, p_device_hash, p_severity, 1)
        RETURNING * INTO v_current;
        v_new_score := p_severity;
    ELSE
        v_new_score := LEAST(100, v_current.risk_score + p_severity);
        UPDATE public.threat_intelligence 
        SET risk_score = v_new_score,
            total_violations = total_violations + 1,
            last_violation_at = now(),
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Aplicar bloqueio se score >= 80
    IF v_new_score >= 80 THEN
        v_block_until := now() + INTERVAL '1 hour';
        UPDATE public.threat_intelligence 
        SET blocked_until = v_block_until,
            threat_level = 'L4_block'
        WHERE user_id = p_user_id;
    ELSIF v_new_score >= 50 THEN
        UPDATE public.threat_intelligence 
        SET threat_level = 'L3_logout'
        WHERE user_id = p_user_id;
    ELSIF v_new_score >= 30 THEN
        UPDATE public.threat_intelligence 
        SET threat_level = 'L2_blur'
        WHERE user_id = p_user_id;
    END IF;
    
    -- Logar evento
    INSERT INTO public.security_events (event_type, severity, user_id, payload)
    VALUES (
        'asset_violation',
        CASE WHEN v_new_score >= 80 THEN 'critical' ELSE 'warning' END,
        p_user_id,
        jsonb_build_object(
            'violation_type', p_violation_type,
            'severity', p_severity,
            'new_score', v_new_score,
            'device_hash', p_device_hash
        )
    );
    
    RETURN QUERY SELECT v_new_score, v_new_score >= 80, v_block_until;
END;
$$;

-- ============================================
-- 5. FUNÇÃO: fn_decay_threat_scores (decaimento)
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_decay_threat_scores()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    WITH updated AS (
        UPDATE public.threat_intelligence
        SET risk_score = GREATEST(0, risk_score - 5),
            threat_level = CASE 
                WHEN risk_score - 5 < 30 THEN 'none'
                WHEN risk_score - 5 < 50 THEN 'L1_warning'
                WHEN risk_score - 5 < 80 THEN 'L2_blur'
                ELSE threat_level
            END,
            updated_at = now()
        WHERE risk_score > 0
        AND (last_violation_at IS NULL OR last_violation_at < now() - INTERVAL '1 hour')
        RETURNING id
    )
    SELECT COUNT(*) INTO v_updated FROM updated;
    
    RETURN v_updated;
END;
$$;

-- ============================================
-- 6. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.ena_asset_access IS '🏛️ SANCTUM 3500: Controle de acesso por asset/usuário';
COMMENT ON FUNCTION public.fn_check_premium_access IS '🏛️ Verifica RBAC + lock para acesso a asset premium';
COMMENT ON FUNCTION public.fn_log_asset_access IS '🏛️ Logging forense de acesso a conteúdo';
COMMENT ON FUNCTION public.fn_apply_asset_violation IS '🏛️ Aplica violação e aumenta risk score';
COMMENT ON FUNCTION public.fn_decay_threat_scores IS '🏛️ Decaimento automático de scores de ameaça';
