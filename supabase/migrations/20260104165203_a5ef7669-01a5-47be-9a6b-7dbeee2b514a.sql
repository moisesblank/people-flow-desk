-- Fix P0: create_video_session não pode referenciar coluna inexistente em profiles
-- (profiles possui 'nome' e não 'nome_completo')

CREATE OR REPLACE FUNCTION public.create_video_session(
    p_user_id UUID,
    p_lesson_id UUID DEFAULT NULL,
    p_course_id UUID DEFAULT NULL,
    p_provider TEXT DEFAULT 'panda',
    p_provider_video_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
    v_session_code TEXT;
    v_session_token TEXT;
    v_watermark_text TEXT;
    v_watermark_hash TEXT;
    v_user_name TEXT;
    v_user_cpf TEXT;
    v_expires_at TIMESTAMPTZ;
    v_is_banned BOOLEAN;
    v_revoked_count INTEGER := 0;
BEGIN
    SELECT is_banned INTO v_is_banned
    FROM public.video_user_risk_scores
    WHERE user_id = p_user_id;

    IF v_is_banned = TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'USER_BANNED',
            'message', 'Acesso ao vídeo bloqueado por violações de segurança'
        );
    END IF;

    UPDATE public.video_play_sessions
    SET 
        status = 'revoked',
        revoked_at = now(),
        revoke_reason = 'NEW_SESSION'
    WHERE user_id = p_user_id 
      AND status = 'active';
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

    -- FIX: profiles não possui 'nome_completo'
    SELECT 
        COALESCE(p.nome, 'Aluno'),
        COALESCE(p.cpf, '')
    INTO v_user_name, v_user_cpf
    FROM public.profiles p
    WHERE p.id = p_user_id;

    v_session_code := public.generate_session_code();
    v_session_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;

    IF length(v_user_cpf) >= 11 THEN
        v_user_cpf := '***.' || substr(v_user_cpf, 4, 3) || '.' || substr(v_user_cpf, 7, 3) || '-**';
    END IF;

    v_watermark_text := upper(COALESCE(v_user_name, 'ALUNO')) || ' • ' || COALESCE(v_user_cpf, '') || ' • ' || v_session_code;
    v_watermark_hash := encode(sha256(v_watermark_text::bytea), 'hex');

    INSERT INTO public.video_play_sessions (
        user_id, lesson_id, course_id, provider, provider_video_id,
        session_code, session_token, watermark_text, watermark_hash,
        expires_at, ip_address, user_agent, device_fingerprint
    ) VALUES (
        p_user_id, p_lesson_id, p_course_id, p_provider, COALESCE(p_provider_video_id, ''),
        v_session_code, v_session_token, v_watermark_text, v_watermark_hash,
        v_expires_at, p_ip_address, p_user_agent, p_device_fingerprint
    ) RETURNING id INTO v_session_id;

    INSERT INTO public.video_access_logs (
        user_id, session_id, action, lesson_id, course_id, provider, provider_video_id,
        ip_address, user_agent, device_fingerprint, details
    ) VALUES (
        p_user_id, v_session_id, 'authorize', p_lesson_id, p_course_id, p_provider, p_provider_video_id,
        p_ip_address, p_user_agent, p_device_fingerprint,
        jsonb_build_object('revoked_previous', v_revoked_count, 'ttl_minutes', p_ttl_minutes)
    );

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'session_code', v_session_code,
        'session_token', v_session_token,
        'expires_at', v_expires_at,
        'watermark', jsonb_build_object('text', v_watermark_text, 'hash', left(v_watermark_hash, 8), 'mode', 'moving'),
        'revoked_previous', v_revoked_count
    );
END;
$$;