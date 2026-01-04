-- =============================================
-- CORREÇÃO: Funções RPC do Video Fortress (APENAS PANDA)
-- Problema 1: video_session_heartbeat usa total_watch_time_seconds (não existe)
-- Problema 2: register_video_violation busca role em profiles (não existe)
-- =============================================

-- CORREÇÃO 1: Função de Heartbeat - Corrigir nome da coluna
CREATE OR REPLACE FUNCTION public.video_session_heartbeat(
    p_session_token TEXT,
    p_position_seconds INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session RECORD;
    v_now TIMESTAMPTZ := now();
BEGIN
    SELECT * INTO v_session FROM public.video_play_sessions WHERE session_token = p_session_token;

    IF v_session IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
    END IF;

    IF v_session.status = 'revoked' THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_REVOKED', 'reason', v_session.revoke_reason);
    END IF;

    IF v_session.status = 'expired' OR v_session.expires_at < v_now THEN
        UPDATE public.video_play_sessions SET status = 'expired' WHERE id = v_session.id AND status = 'active';
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_EXPIRED');
    END IF;

    -- CORREÇÃO: Usar total_watch_seconds (coluna real) ao invés de total_watch_time_seconds
    UPDATE public.video_play_sessions
    SET 
        last_heartbeat_at = v_now,
        heartbeat_count = COALESCE(heartbeat_count, 0) + 1,
        max_position_seconds = GREATEST(COALESCE(max_position_seconds, 0), COALESCE(p_position_seconds, 0)),
        total_watch_seconds = COALESCE(total_watch_seconds, 0) + 30
    WHERE id = v_session.id;

    -- Auto-renovar sessão se próximo de expirar
    IF v_session.expires_at - v_now < interval '2 minutes' THEN
        UPDATE public.video_play_sessions SET expires_at = v_now + interval '5 minutes' WHERE id = v_session.id;
    END IF;

    RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'expires_at', v_session.expires_at, 'status', 'active');
END;
$$;

-- CORREÇÃO 2: Função de Violação - Buscar role de user_roles ao invés de profiles
CREATE OR REPLACE FUNCTION public.register_video_violation(
    p_session_token TEXT,
    p_violation_type TEXT,
    p_severity INTEGER DEFAULT 1,
    p_details JSONB DEFAULT NULL,
    p_key_pressed TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session RECORD;
    v_user_role TEXT;
    v_new_risk_score INTEGER;
    v_action_taken TEXT := 'none';
    v_should_revoke BOOLEAN := FALSE;
    v_is_immune BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_session FROM public.video_play_sessions WHERE session_token = p_session_token;

    IF v_session IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND');
    END IF;

    -- CORREÇÃO: Buscar role de user_roles ao invés de profiles
    SELECT role::TEXT INTO v_user_role FROM public.user_roles WHERE user_id = v_session.user_id LIMIT 1;
    
    -- Roles imunes ao SANCTUM (não sofrem penalidades)
    v_is_immune := v_user_role IN ('owner', 'admin', 'funcionario', 'suporte', 'coordenacao', 'monitoria');

    IF v_is_immune THEN
        -- Apenas logar, sem penalidade
        INSERT INTO public.video_access_logs (user_id, session_id, action, lesson_id, provider_video_id, ip_address, user_agent, details)
        VALUES (v_session.user_id, v_session.id, 'violation', v_session.lesson_id, v_session.provider_video_id, p_ip_address::inet, p_user_agent,
            jsonb_build_object('type', p_violation_type, 'severity', p_severity, 'sanctum_bypass', true, 'role', v_user_role));
        RETURN jsonb_build_object('success', true, 'action_taken', 'none', 'session_revoked', false, 'new_risk_score', 0, 'sanctum_bypass', true);
    END IF;

    -- Calcular novo score de risco
    v_new_risk_score := COALESCE(v_session.risk_score, 0) + (p_severity * 5);

    -- Determinar ação baseada no score
    IF v_new_risk_score >= 200 AND p_severity >= 9 THEN
        v_action_taken := 'revoke';
        v_should_revoke := TRUE;
    ELSIF v_new_risk_score >= 100 THEN
        v_action_taken := 'pause';
    ELSIF v_new_risk_score >= 60 THEN
        v_action_taken := 'degrade';
    ELSIF v_new_risk_score >= 30 THEN
        v_action_taken := 'warn';
    ELSE
        v_action_taken := 'none';
    END IF;

    -- Registrar violação
    INSERT INTO public.video_violations (
        user_id, session_id, violation_type, severity, lesson_id, provider_video_id,
        details, key_pressed, action_taken, ip_address, user_agent
    ) VALUES (
        v_session.user_id, v_session.id, p_violation_type, p_severity, v_session.lesson_id, v_session.provider_video_id,
        p_details, p_key_pressed, v_action_taken, p_ip_address::inet, p_user_agent
    );

    -- Atualizar sessão
    UPDATE public.video_play_sessions
    SET 
        risk_score = v_new_risk_score,
        violation_count = COALESCE(violation_count, 0) + 1,
        status = CASE WHEN v_should_revoke THEN 'revoked'::video_session_status ELSE status END,
        revoked_at = CASE WHEN v_should_revoke THEN now() ELSE revoked_at END,
        revoke_reason = CASE WHEN v_should_revoke THEN 'SECURITY_VIOLATION_CONFIRMED' ELSE revoke_reason END
    WHERE id = v_session.id;

    -- Atualizar score global do usuário
    INSERT INTO public.video_user_risk_scores (user_id, total_risk_score, total_violations, last_violation_at, first_violation_at)
    VALUES (v_session.user_id, p_severity * 5, 1, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET
        total_risk_score = video_user_risk_scores.total_risk_score + (p_severity * 5),
        total_violations = video_user_risk_scores.total_violations + 1,
        violations_last_24h = COALESCE(video_user_risk_scores.violations_last_24h, 0) + 1,
        last_violation_at = now(),
        current_risk_level = CASE 
            WHEN video_user_risk_scores.total_risk_score + (p_severity * 5) >= 1000 THEN 'critical'
            WHEN video_user_risk_scores.total_risk_score + (p_severity * 5) >= 500 THEN 'high'
            WHEN video_user_risk_scores.total_risk_score + (p_severity * 5) >= 200 THEN 'medium'
            ELSE 'low'
        END,
        updated_at = now();

    -- Log de acesso
    INSERT INTO public.video_access_logs (user_id, session_id, action, lesson_id, provider_video_id, ip_address, user_agent, details)
    VALUES (v_session.user_id, v_session.id, 'violation', v_session.lesson_id, v_session.provider_video_id, p_ip_address::inet, p_user_agent,
        jsonb_build_object('type', p_violation_type, 'severity', p_severity, 'action', v_action_taken, 'score', v_new_risk_score));

    RETURN jsonb_build_object('success', true, 'action_taken', v_action_taken, 'session_revoked', v_should_revoke, 'new_risk_score', v_new_risk_score);
END;
$$;