-- ============================================================
-- 🔥 VIDEO FORTRESS ULTRA v2.0 - FUNÇÕES FINAIS
-- ============================================================

-- 7.5 Verificar domínio autorizado
CREATE OR REPLACE FUNCTION public.is_domain_authorized(p_domain TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.video_domain_whitelist WHERE domain = p_domain AND is_active = TRUE);
END;
$$;

-- 7.6 Finalizar sessão
CREATE OR REPLACE FUNCTION public.end_video_session(p_session_token TEXT, p_final_position INTEGER DEFAULT NULL, p_completion_percentage DECIMAL DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM public.video_play_sessions WHERE session_token = p_session_token AND status = 'active';
    IF v_session IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND'); END IF;
    
    UPDATE public.video_play_sessions SET status = 'ended', ended_at = now(),
        max_position_seconds = GREATEST(COALESCE(max_position_seconds, 0), COALESCE(p_final_position, 0)),
        completion_percentage = COALESCE(p_completion_percentage, completion_percentage)
    WHERE id = v_session.id;
    
    INSERT INTO public.video_access_logs (user_id, session_id, action, lesson_id, position_seconds, details)
    VALUES (v_session.user_id, v_session.id, 'complete', v_session.lesson_id, p_final_position,
        jsonb_build_object('completion', p_completion_percentage, 'total_watch_time', v_session.total_watch_time_seconds));
    
    RETURN jsonb_build_object('success', true, 'session_ended', true);
END;
$$;

-- 7.7 Cleanup de sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_video_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.video_play_sessions SET status = 'expired'
    WHERE status = 'active' AND (expires_at < now() OR last_heartbeat_at < now() - interval '2 minutes');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_video_risk_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS tr_video_risk_updated ON public.video_user_risk_scores;
CREATE TRIGGER tr_video_risk_updated 
    BEFORE UPDATE ON public.video_user_risk_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_video_risk_timestamp();

-- Grants
GRANT EXECUTE ON FUNCTION public.is_domain_authorized TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_video_sessions TO authenticated;

-- Comentários
COMMENT ON FUNCTION public.is_domain_authorized IS '🔥 VIDEO FORTRESS: Verifica se domínio está na whitelist';
COMMENT ON FUNCTION public.end_video_session IS '🔥 VIDEO FORTRESS: Finaliza sessão de vídeo com métricas';
COMMENT ON FUNCTION public.cleanup_expired_video_sessions IS '🔥 VIDEO FORTRESS: Cleanup de sessões expiradas (cron)';