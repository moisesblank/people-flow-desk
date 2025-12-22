-- ============================================
-- DROPAR função existente com tipo incompatível
-- ============================================
DROP FUNCTION IF EXISTS public.audit_rls_coverage();

-- 5.14 FUNÇÃO: audit_rls_coverage_v2 - Auditar cobertura RLS
CREATE OR REPLACE FUNCTION public.audit_rls_coverage_v2()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT,
    has_select_policy BOOLEAN,
    has_insert_policy BOOLEAN,
    has_update_policy BOOLEAN,
    has_delete_policy BOOLEAN,
    risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::BIGINT,
        COALESCE(p.has_select, false),
        COALESCE(p.has_insert, false),
        COALESCE(p.has_update, false),
        COALESCE(p.has_delete, false),
        CASE 
            WHEN NOT t.rowsecurity THEN 'CRITICAL'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH'
            WHEN NOT COALESCE(p.has_select, false) THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            pol.tablename,
            COUNT(*) as policy_count,
            BOOL_OR(pol.cmd = 'SELECT' OR pol.cmd = '*') as has_select,
            BOOL_OR(pol.cmd = 'INSERT' OR pol.cmd = '*') as has_insert,
            BOOL_OR(pol.cmd = 'UPDATE' OR pol.cmd = '*') as has_update,
            BOOL_OR(pol.cmd = 'DELETE' OR pol.cmd = '*') as has_delete
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
        GROUP BY pol.tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE '_prisma_%'
    ORDER BY 
        CASE 
            WHEN NOT t.rowsecurity THEN 1
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 2
            ELSE 3
        END,
        t.tablename;
END;
$$;

-- ============================================
-- PARTE 6: FUNÇÕES DE CLEANUP
-- ============================================

-- 6.1 Limpar rate limits expirados
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits_v3()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.rate_limit_state
    WHERE updated_at < now() - INTERVAL '1 day';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 6.2 Limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions_v3()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.active_sessions
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < now();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Deletar sessões muito antigas
    DELETE FROM public.active_sessions
    WHERE created_at < now() - INTERVAL '30 days';
    
    RETURN v_count;
END;
$$;

-- 6.3 Limpar eventos de segurança resolvidos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events_v2()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.security_events
    WHERE resolved = true
    AND resolved_at < now() - INTERVAL '90 days';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================
-- PARTE 7: TRIGGERS DE AUDITORIA
-- ============================================

-- 7.1 Trigger para auditar mudanças em user_roles
CREATE OR REPLACE FUNCTION public.audit_role_changes_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            INSERT INTO public.security_audit_log (
                user_id, action, action_category, table_name, record_id,
                old_data, new_data, severity
            ) VALUES (
                NEW.user_id,
                'role_changed',
                'security',
                'user_roles',
                NEW.user_id::TEXT,
                jsonb_build_object('role', OLD.role),
                jsonb_build_object('role', NEW.role),
                'critical'
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.security_audit_log (
            user_id, action, action_category, table_name, record_id,
            new_data, severity
        ) VALUES (
            NEW.user_id,
            'role_assigned',
            'security',
            'user_roles',
            NEW.user_id::TEXT,
            jsonb_build_object('role', NEW.role),
            'warning'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_role_changes ON public.user_roles;
CREATE TRIGGER trigger_audit_role_changes
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_role_changes_v2();

-- ============================================
-- PARTE 8: COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION public.audit_rls_coverage_v2 IS '🛡️ Auditar cobertura RLS em todas as tabelas';
COMMENT ON FUNCTION public.cleanup_rate_limits_v3 IS '🛡️ Limpar rate limits expirados';
COMMENT ON FUNCTION public.cleanup_expired_sessions_v3 IS '🛡️ Limpar sessões expiradas';
COMMENT ON FUNCTION public.cleanup_old_security_events_v2 IS '🛡️ Limpar eventos de segurança antigos';

-- ============================================================
-- 🧠 SISTEMA NERVOSO AUTÔNOMO (SNA) OMEGA v5.0
-- ============================================================

-- Enums avançados para SNA
DO $$ BEGIN
  CREATE TYPE sna_job_status AS ENUM (
    'pending', 'scheduled', 'running', 'succeeded', 'failed', 'dead', 'cancelled', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sna_priority AS ENUM ('p0_critical', 'p1_urgent', 'p2_high', 'p3_normal', 'p4_low', 'p5_batch');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sna_provider AS ENUM (
    'gemini_flash', 'gemini_pro', 'gpt5', 'gpt5_mini', 'gpt5_nano',
    'claude_opus', 'perplexity', 'firecrawl', 'elevenlabs', 'whisper', 'dall_e', 'internal'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sna_agent_role AS ENUM (
    'router', 'tutor', 'curator', 'moderator', 'marketing', 'operations', 'financial', 'support'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2.1 SNA_JOBS: Fila de jobs
CREATE TABLE IF NOT EXISTS public.sna_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  tenant_id TEXT DEFAULT 'default',
  
  -- Identificação única
  job_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  correlation_id UUID DEFAULT gen_random_uuid(),
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 3 CHECK (priority >= 0 AND priority <= 5),
  
  -- Payload
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Retry avançado
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  retry_strategy TEXT DEFAULT 'exponential',
  base_delay_seconds INT DEFAULT 30,
  
  -- Scheduling
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  timeout_seconds INT DEFAULT 300,
  
  -- Lock
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  lock_token UUID,
  
  -- Hierarquia
  parent_job_id UUID REFERENCES public.sna_jobs(id),
  root_job_id UUID REFERENCES public.sna_jobs(id),
  step_number INT DEFAULT 1,
  total_steps INT DEFAULT 1,
  
  -- Métricas
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INT,
  queue_time_ms INT,
  
  -- Custo
  provider TEXT,
  model TEXT,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  estimated_cost_usd NUMERIC(12, 8) DEFAULT 0,
  actual_cost_usd NUMERIC(12, 8) DEFAULT 0,
  
  -- Tags para queries
  tags TEXT[] DEFAULT '{}',
  
  -- Resultado simplificado
  success BOOLEAN,
  result_summary TEXT
);

-- Índices otimizados para alta concorrência
CREATE UNIQUE INDEX IF NOT EXISTS sna_jobs_idempotency_uq 
  ON public.sna_jobs (job_type, idempotency_key);

CREATE INDEX IF NOT EXISTS sna_jobs_queue_idx 
  ON public.sna_jobs (status, priority, run_after) 
  WHERE status IN ('pending', 'scheduled');

CREATE INDEX IF NOT EXISTS sna_jobs_running_idx 
  ON public.sna_jobs (status, locked_at) 
  WHERE status = 'running';

CREATE INDEX IF NOT EXISTS sna_jobs_user_idx 
  ON public.sna_jobs (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS sna_jobs_correlation_idx 
  ON public.sna_jobs (correlation_id);

CREATE INDEX IF NOT EXISTS sna_jobs_parent_idx 
  ON public.sna_jobs (parent_job_id) 
  WHERE parent_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sna_jobs_tags_idx 
  ON public.sna_jobs USING GIN (tags);

CREATE INDEX IF NOT EXISTS sna_jobs_type_status_idx 
  ON public.sna_jobs (job_type, status, created_at DESC);

-- RLS para sna_jobs
ALTER TABLE public.sna_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sna_jobs_owner_all" ON public.sna_jobs;
CREATE POLICY "sna_jobs_owner_all" ON public.sna_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "sna_jobs_system_insert" ON public.sna_jobs;
CREATE POLICY "sna_jobs_system_insert" ON public.sna_jobs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "sna_jobs_user_read" ON public.sna_jobs;
CREATE POLICY "sna_jobs_user_read" ON public.sna_jobs
    FOR SELECT USING (created_by = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.sna_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sna_jobs_updated_at ON public.sna_jobs;
CREATE TRIGGER trigger_sna_jobs_updated_at
    BEFORE UPDATE ON public.sna_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.sna_jobs_updated_at();