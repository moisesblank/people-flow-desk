
-- ============================================
-- 🛡️ FORTALEZA DIGITAL - CLEANUP & TRIGGERS
-- ============================================

-- FUNÇÕES DE CLEANUP
CREATE OR REPLACE FUNCTION public.fortress_cleanup_rate_limits()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_count INTEGER;
BEGIN
    DELETE FROM public.rate_limit_state WHERE updated_at < now() - INTERVAL '1 day';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.fortress_cleanup_sessions()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.active_sessions SET status = 'expired' WHERE status = 'active' AND expires_at < now();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    DELETE FROM public.active_sessions WHERE created_at < now() - INTERVAL '30 days';
    RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.fortress_cleanup_security_events()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_count INTEGER;
BEGIN
    DELETE FROM public.security_events WHERE resolved = true AND resolved_at < now() - INTERVAL '90 days';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END; $$;

-- TRIGGER PARA MUDANÇAS EM USER_ROLES (não profiles.role)
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.fortress_log_event('role_changed', NEW.user_id, NULL, NULL, 80, 
            jsonb_build_object('action', 'grant', 'new_role', NEW.role::TEXT));
    ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        PERFORM public.fortress_log_event('role_changed', NEW.user_id, NULL, NULL, 90, 
            jsonb_build_object('old_role', OLD.role::TEXT, 'new_role', NEW.role::TEXT));
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.fortress_log_event('role_changed', OLD.user_id, NULL, NULL, 85, 
            jsonb_build_object('action', 'revoke', 'old_role', OLD.role::TEXT));
    END IF;
    RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trigger_audit_role_changes ON public.user_roles;
CREATE TRIGGER trigger_audit_role_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- ============================================
-- 🧠 SNA OMEGA - TABELAS CORE
-- ============================================

-- Enums SNA
DO $$ BEGIN CREATE TYPE sna_job_status AS ENUM ('pending', 'scheduled', 'running', 'succeeded', 'failed', 'dead', 'cancelled', 'paused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sna_priority AS ENUM ('p0_critical', 'p1_urgent', 'p2_high', 'p3_normal', 'p4_low', 'p5_batch'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sna_provider AS ENUM ('gemini_flash', 'gemini_pro', 'gpt5', 'gpt5_mini', 'gpt5_nano', 'claude_opus', 'perplexity', 'firecrawl', 'elevenlabs', 'whisper', 'dall_e', 'internal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SNA_JOBS: Fila de jobs
CREATE TABLE IF NOT EXISTS public.sna_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    job_type TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    correlation_id UUID DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending',
    priority INT NOT NULL DEFAULT 3 CHECK (priority >= 0 AND priority <= 5),
    input JSONB NOT NULL DEFAULT '{}'::jsonb,
    output JSONB,
    error JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_ms INT,
    provider TEXT,
    model TEXT,
    tokens_in INT DEFAULT 0,
    tokens_out INT DEFAULT 0,
    estimated_cost_usd NUMERIC(12, 8) DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    success BOOLEAN
);

CREATE UNIQUE INDEX IF NOT EXISTS sna_jobs_idempotency_uq ON public.sna_jobs (job_type, idempotency_key);
CREATE INDEX IF NOT EXISTS sna_jobs_queue_idx ON public.sna_jobs (status, priority, run_after) WHERE status IN ('pending', 'scheduled');
CREATE INDEX IF NOT EXISTS sna_jobs_user_idx ON public.sna_jobs (created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS sna_jobs_correlation_idx ON public.sna_jobs (correlation_id);
CREATE INDEX IF NOT EXISTS sna_jobs_tags_idx ON public.sna_jobs USING GIN (tags);

-- SNA_TOOL_RUNS: Auditoria detalhada
CREATE TABLE IF NOT EXISTS public.sna_tool_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    job_id UUID REFERENCES public.sna_jobs(id) ON DELETE SET NULL,
    correlation_id UUID,
    tool_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    ok BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    latency_ms INT,
    tokens_in INT,
    tokens_out INT,
    cost_usd NUMERIC(12, 8),
    user_id UUID REFERENCES auth.users(id),
    cache_hit BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS sna_tool_runs_job_idx ON public.sna_tool_runs (job_id);
CREATE INDEX IF NOT EXISTS sna_tool_runs_correlation_idx ON public.sna_tool_runs (correlation_id);
CREATE INDEX IF NOT EXISTS sna_tool_runs_tool_time_idx ON public.sna_tool_runs (tool_name, created_at DESC);

-- RLS para SNA
ALTER TABLE public.sna_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_tool_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_jobs_owner" ON public.sna_jobs;
CREATE POLICY "sna_jobs_owner" ON public.sna_jobs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
);

DROP POLICY IF EXISTS "sna_tool_runs_owner" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_owner" ON public.sna_tool_runs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
);
