-- ============================================
-- 🔥 FASE 6: DevSecOps (C080-C085)
-- Controles de deploy e auditoria de segurança
-- ============================================

-- C080: Tabela de deployment gates
CREATE TABLE IF NOT EXISTS public.deployment_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_name TEXT NOT NULL UNIQUE,
    gate_type TEXT NOT NULL CHECK (gate_type IN ('security_scan', 'dependency_audit', 'secrets_check', 'rls_validation', 'performance_check')),
    is_blocking BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_check_at TIMESTAMPTZ,
    last_status TEXT CHECK (last_status IN ('pass', 'fail', 'warning', 'skipped')),
    last_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gates padrão
INSERT INTO public.deployment_gates (gate_name, gate_type, is_blocking, is_active)
VALUES 
    ('npm_audit_high_critical', 'dependency_audit', true, true),
    ('codeql_sast', 'security_scan', true, true),
    ('secrets_trufflehog', 'secrets_check', true, true),
    ('rls_all_tables', 'rls_validation', true, true),
    ('lighthouse_performance', 'performance_check', false, true)
ON CONFLICT (gate_name) DO NOTHING;

-- RLS
ALTER TABLE public.deployment_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deployment_gates_read" ON public.deployment_gates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "deployment_gates_admin" ON public.deployment_gates
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin'))
    );

-- C081: Tabela de histórico de deploys
CREATE TABLE IF NOT EXISTS public.deployment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deploy_version TEXT NOT NULL,
    deploy_type TEXT NOT NULL CHECK (deploy_type IN ('frontend', 'backend', 'edge_function', 'migration', 'full')),
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    deployed_by UUID REFERENCES auth.users(id),
    commit_hash TEXT,
    branch TEXT,
    gates_passed JSONB DEFAULT '[]'::JSONB,
    gates_failed JSONB DEFAULT '[]'::JSONB,
    rollback_version TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE public.deployment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deployment_history_read" ON public.deployment_history
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin', 'employee'))
    );

CREATE POLICY "deployment_history_insert" ON public.deployment_history
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin'))
    );

-- C082: Função para verificar gates antes de deploy
CREATE OR REPLACE FUNCTION public.check_deployment_gates()
RETURNS TABLE(
    gate_name TEXT,
    gate_type TEXT,
    is_blocking BOOLEAN,
    status TEXT,
    can_deploy BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blocking_failures INTEGER;
BEGIN
    -- Contar falhas bloqueantes
    SELECT COUNT(*) INTO v_blocking_failures
    FROM public.deployment_gates
    WHERE is_active = true 
      AND is_blocking = true 
      AND last_status = 'fail';

    RETURN QUERY
    SELECT 
        dg.gate_name,
        dg.gate_type,
        dg.is_blocking,
        COALESCE(dg.last_status, 'pending') AS status,
        (v_blocking_failures = 0) AS can_deploy
    FROM public.deployment_gates dg
    WHERE dg.is_active = true
    ORDER BY dg.is_blocking DESC, dg.gate_name;
END;
$$;

-- C083: Função para atualizar status de gate
CREATE OR REPLACE FUNCTION public.update_deployment_gate(
    p_gate_name TEXT,
    p_status TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.deployment_gates
    SET 
        last_status = p_status,
        last_check_at = now(),
        last_details = COALESCE(p_details, last_details),
        updated_at = now()
    WHERE gate_name = p_gate_name;

    -- Logar em security_audit_log
    INSERT INTO public.security_audit_log (action, severity, user_id, payload)
    VALUES (
        'DEPLOYMENT_GATE_UPDATE',
        CASE WHEN p_status = 'fail' THEN 'error' ELSE 'info' END,
        auth.uid(),
        jsonb_build_object(
            'gate_name', p_gate_name,
            'status', p_status,
            'details', p_details
        )
    );

    RETURN FOUND;
END;
$$;

-- C084: Função para registrar deploy
CREATE OR REPLACE FUNCTION public.register_deployment(
    p_version TEXT,
    p_type TEXT,
    p_environment TEXT,
    p_commit_hash TEXT DEFAULT NULL,
    p_branch TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deploy_id UUID;
    v_gates_passed JSONB;
    v_gates_failed JSONB;
    v_can_deploy BOOLEAN;
BEGIN
    -- Verificar gates
    SELECT 
        jsonb_agg(gate_name) FILTER (WHERE status = 'pass'),
        jsonb_agg(gate_name) FILTER (WHERE status = 'fail' AND is_blocking),
        bool_and(can_deploy)
    INTO v_gates_passed, v_gates_failed, v_can_deploy
    FROM public.check_deployment_gates();

    -- Se ambiente é produção e há gates bloqueantes falhando, rejeitar
    IF p_environment = 'production' AND NOT v_can_deploy THEN
        RAISE EXCEPTION 'Deploy bloqueado por gates de segurança: %', v_gates_failed;
    END IF;

    -- Registrar deploy
    INSERT INTO public.deployment_history (
        deploy_version, deploy_type, environment, status,
        deployed_by, commit_hash, branch, 
        gates_passed, gates_failed, notes
    ) VALUES (
        p_version, p_type, p_environment, 
        CASE WHEN p_environment = 'production' THEN 'in_progress' ELSE 'success' END,
        auth.uid(), p_commit_hash, p_branch,
        COALESCE(v_gates_passed, '[]'::JSONB),
        COALESCE(v_gates_failed, '[]'::JSONB),
        p_notes
    )
    RETURNING id INTO v_deploy_id;

    -- Logar
    INSERT INTO public.security_audit_log (action, severity, user_id, payload)
    VALUES (
        'DEPLOYMENT_REGISTERED',
        'info',
        auth.uid(),
        jsonb_build_object(
            'deploy_id', v_deploy_id,
            'version', p_version,
            'environment', p_environment,
            'gates_passed', v_gates_passed,
            'gates_failed', v_gates_failed
        )
    );

    RETURN v_deploy_id;
END;
$$;

-- C085: Função para auditoria de segurança RLS
CREATE OR REPLACE FUNCTION public.audit_rls_coverage()
RETURNS TABLE(
    table_name TEXT,
    has_rls BOOLEAN,
    policy_count INTEGER,
    is_compliant BOOLEAN,
    risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT AS table_name,
        t.rowsecurity AS has_rls,
        COALESCE(p.policy_count, 0)::INTEGER AS policy_count,
        (t.rowsecurity = true AND COALESCE(p.policy_count, 0) > 0) AS is_compliant,
        CASE 
            WHEN NOT t.rowsecurity THEN 'CRITICAL'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH'
            WHEN COALESCE(p.policy_count, 0) < 2 THEN 'MEDIUM'
            ELSE 'LOW'
        END AS risk_level
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            schemaname, 
            tablename, 
            COUNT(*) AS policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
    ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    ORDER BY 
        CASE 
            WHEN NOT t.rowsecurity THEN 1
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 2
            ELSE 3
        END,
        t.tablename;
END;
$$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_deployment_history_env ON public.deployment_history (environment, status);
CREATE INDEX IF NOT EXISTS idx_deployment_history_date ON public.deployment_history (started_at DESC);