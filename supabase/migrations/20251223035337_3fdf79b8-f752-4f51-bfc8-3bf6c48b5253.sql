
-- ============================================
-- 🔥 SANCTUM SYNAPSE 3500 - MEGA CORREÇÃO v2
-- Corrige search_path + Melhora performance 5K
-- ============================================

-- ============================================
-- 1. CORRIGIR FUNÇÕES SEM SEARCH_PATH
-- ============================================

ALTER FUNCTION public.cleanup_expired_video_sessions_omega SET search_path = public;
ALTER FUNCTION public.create_video_session_omega SET search_path = public;
ALTER FUNCTION public.decay_video_risk_scores SET search_path = public;
ALTER FUNCTION public.generate_video_session_code SET search_path = public;
ALTER FUNCTION public.get_video_metrics SET search_path = public;
ALTER FUNCTION public.is_video_admin SET search_path = public;
ALTER FUNCTION public.update_video_risk_timestamp SET search_path = public;
ALTER FUNCTION public.sna_cache_set SET search_path = public;
ALTER FUNCTION public.sna_check_budget SET search_path = public;
ALTER FUNCTION public.sna_check_feature SET search_path = public;
ALTER FUNCTION public.sna_cleanup SET search_path = public;
ALTER FUNCTION public.sna_consume_budget SET search_path = public;
ALTER FUNCTION public.sna_get_metrics SET search_path = public;
ALTER FUNCTION public.sna_log_tool_run SET search_path = public;
ALTER FUNCTION public.get_dead_click_stats SET search_path = public;
ALTER FUNCTION public.get_url_access_stats SET search_path = public;
ALTER FUNCTION public.is_matrix_admin SET search_path = public;
ALTER FUNCTION public.log_url_access SET search_path = public;
ALTER FUNCTION public.resolve_dead_click SET search_path = public;
ALTER FUNCTION public.run_ui_audit SET search_path = public;
ALTER FUNCTION public.apply_risk_score_decay SET search_path = public;
ALTER FUNCTION public.generate_correlation_id SET search_path = public;
ALTER FUNCTION public.generate_session_code SET search_path = public;
ALTER FUNCTION public.update_risk_score_timestamp SET search_path = public;

-- ============================================
-- 2. FUNÇÃO OTIMIZADA DE RATE LIMIT PARA CHAT 5K
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_chat_rate_limit_5k(
    p_user_id UUID,
    p_live_id UUID,
    p_max_per_sec INTEGER DEFAULT 1,
    p_max_per_min INTEGER DEFAULT 20
)
RETURNS TABLE (allowed BOOLEAN, cooldown_ms INTEGER, reason TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_last_msg TIMESTAMPTZ;
    v_count_min INTEGER;
    v_now TIMESTAMPTZ := now();
    v_is_banned BOOLEAN;
    v_timeout_until TIMESTAMPTZ;
BEGIN
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
    IF v_role IN ('owner', 'admin') THEN
        RETURN QUERY SELECT true, 0, 'admin_bypass'::TEXT;
        RETURN;
    END IF;
    
    SELECT is_ban, timeout_until INTO v_is_banned, v_timeout_until
    FROM public.live_chat_bans WHERE live_id = p_live_id AND user_id = p_user_id LIMIT 1;
    
    IF v_is_banned = true THEN
        RETURN QUERY SELECT false, 999999, 'banned'::TEXT;
        RETURN;
    END IF;
    
    IF v_timeout_until IS NOT NULL AND v_timeout_until > v_now THEN
        RETURN QUERY SELECT false, EXTRACT(EPOCH FROM (v_timeout_until - v_now))::INTEGER * 1000, 'timeout'::TEXT;
        RETURN;
    END IF;
    
    SELECT MAX(created_at) INTO v_last_msg
    FROM public.live_chat_messages
    WHERE user_id = p_user_id AND live_id = p_live_id AND created_at > v_now - INTERVAL '2 seconds';
    
    IF v_last_msg IS NOT NULL THEN
        RETURN QUERY SELECT false, GREATEST(0, (1000 - EXTRACT(EPOCH FROM (v_now - v_last_msg)) * 1000)::INTEGER), 'cooldown'::TEXT;
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO v_count_min
    FROM public.live_chat_messages
    WHERE user_id = p_user_id AND live_id = p_live_id AND created_at > v_now - INTERVAL '1 minute';
    
    IF v_count_min >= p_max_per_min THEN
        RETURN QUERY SELECT false, 60000, 'volume_limit'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 0, 'ok'::TEXT;
END;
$$;

-- ============================================
-- 3. TABELA DE MÉTRICAS DE LIVE (CACHE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.live_metrics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL UNIQUE,
    viewer_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.live_metrics_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Métricas públicas" ON public.live_metrics_cache;
CREATE POLICY "Métricas públicas" ON public.live_metrics_cache FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin atualiza métricas" ON public.live_metrics_cache;
CREATE POLICY "Admin atualiza métricas" ON public.live_metrics_cache FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_live_metrics_live ON public.live_metrics_cache(live_id);

-- ============================================
-- 4. ÍNDICES OTIMIZADOS (SEM now())
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_msg_user_live_time 
ON public.live_chat_messages (user_id, live_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_bans_lookup
ON public.live_chat_bans (live_id, user_id, is_ban, timeout_until);

-- ============================================
-- 5. FUNÇÃO DE HEALTH CHECK
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_system_health_5k()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_db_size TEXT;
    v_active_conn INTEGER;
    v_chat_today INTEGER;
    v_sessions INTEGER;
BEGIN
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_db_size;
    SELECT COUNT(*) INTO v_active_conn FROM pg_stat_activity WHERE state = 'active';
    SELECT COUNT(*) INTO v_chat_today FROM public.live_chat_messages WHERE created_at > date_trunc('day', now());
    SELECT COUNT(*) INTO v_sessions FROM public.active_sessions WHERE status = 'active';
    
    v_result := jsonb_build_object(
        'timestamp', now(),
        'db_size', v_db_size,
        'active_connections', v_active_conn,
        'chat_messages_today', v_chat_today,
        'active_sessions', v_sessions,
        'status', CASE WHEN v_active_conn > 80 THEN 'warning' ELSE 'healthy' END,
        'ready_for_5k', v_active_conn < 50
    );
    
    RETURN v_result;
END;
$$;

-- ============================================
-- 6. FUNÇÃO DE CLEANUP AUTOMÁTICO
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_chat_cleanup_5k()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_deleted INTEGER := 0;
BEGIN
    WITH deleted AS (
        DELETE FROM public.live_chat_messages
        WHERE created_at < now() - INTERVAL '7 days'
        AND is_pinned = false AND is_highlighted = false
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted FROM deleted;
    
    DELETE FROM public.rate_limit_state WHERE updated_at < now() - INTERVAL '1 hour';
    UPDATE public.live_chat_bans SET timeout_until = NULL WHERE timeout_until < now();
    
    INSERT INTO public.audit_logs (action, table_name, metadata)
    VALUES ('CHAT_CLEANUP_5K', 'live_chat_messages', jsonb_build_object('deleted', v_deleted, 'at', now()));
    
    RETURN v_deleted;
END;
$$;

-- ============================================
-- 7. TRIGGER PARA MÉTRICAS
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_trigger_live_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.live_metrics_cache (live_id, message_count, last_message_at, updated_at)
    VALUES (NEW.live_id, 1, NEW.created_at, now())
    ON CONFLICT (live_id) DO UPDATE SET
        message_count = live_metrics_cache.message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_live_metrics ON public.live_chat_messages;
CREATE TRIGGER trg_live_metrics
AFTER INSERT ON public.live_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_live_metrics();

-- ============================================
-- 8. REALTIME PARA MÉTRICAS
-- ============================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_metrics_cache;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 9. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION public.fn_chat_rate_limit_5k IS 'Rate limit 5K: 1 msg/sec, 20/min, admin bypass';
COMMENT ON FUNCTION public.fn_system_health_5k IS 'Health check para monitoramento 5K usuários';
COMMENT ON FUNCTION public.fn_chat_cleanup_5k IS 'Cleanup automático de chat (7 dias)';
COMMENT ON TABLE public.live_metrics_cache IS 'Cache de métricas para evitar queries pesadas';
