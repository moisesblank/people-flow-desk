-- REMOVER MÁSCARA DE CPF NO WATERMARK DE VÍDEO
-- CPF será exibido COMPLETO para cada usuário (cada um vê apenas o seu próprio)

CREATE OR REPLACE FUNCTION public.create_video_session(
    p_user_id uuid,
    p_lesson_id uuid,
    p_course_id uuid DEFAULT NULL,
    p_provider text DEFAULT 'youtube',
    p_provider_video_id text DEFAULT NULL,
    p_ttl_minutes integer DEFAULT 240,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_device_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id uuid;
    v_session_code text;
    v_session_token text;
    v_watermark_text text;
    v_watermark_hash text;
    v_expires_at timestamptz;
    v_user_name text;
    v_user_cpf text;
    v_revoked_count integer;
BEGIN
    -- Revogar sessões anteriores do usuário
    UPDATE public.video_play_sessions 
    SET status = 'revoked', revoked_at = now(), revoke_reason = 'NEW_SESSION' 
    WHERE user_id = p_user_id AND status = 'active';
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

    -- Buscar dados do usuário
    SELECT 
        COALESCE(p.nome, 'Aluno'), 
        COALESCE(p.cpf, '') 
    INTO v_user_name, v_user_cpf 
    FROM public.profiles p 
    WHERE p.id = p_user_id;

    -- Gerar códigos de sessão
    v_session_code := public.generate_video_session_code();
    v_session_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;

    -- FORMATAR CPF COMPLETO (SEM MÁSCARA) - Cada usuário vê apenas o seu próprio
    IF length(v_user_cpf) >= 11 THEN
        v_user_cpf := substr(v_user_cpf, 1, 3) || '.' || 
                      substr(v_user_cpf, 4, 3) || '.' || 
                      substr(v_user_cpf, 7, 3) || '-' || 
                      substr(v_user_cpf, 10, 2);
    END IF;

    -- Montar watermark: NOME • CPF COMPLETO • CÓDIGO
    v_watermark_text := upper(COALESCE(v_user_name, 'ALUNO')) || ' • ' || COALESCE(v_user_cpf, '') || ' • ' || v_session_code;
    v_watermark_hash := encode(sha256(v_watermark_text::bytea), 'hex');

    -- Inserir nova sessão
    INSERT INTO public.video_play_sessions (
        user_id, lesson_id, course_id, provider, provider_video_id, 
        session_code, session_token, watermark_text, watermark_hash, 
        expires_at, ip_address, user_agent, device_fingerprint
    )
    VALUES (
        p_user_id, p_lesson_id, p_course_id, p_provider, p_provider_video_id, 
        v_session_code, v_session_token, v_watermark_text, v_watermark_hash, 
        v_expires_at, p_ip_address, p_user_agent, p_device_fingerprint
    ) 
    RETURNING id INTO v_session_id;

    -- Log de acesso
    INSERT INTO public.video_access_logs (
        user_id, session_id, action, lesson_id, course_id, 
        provider, provider_video_id, ip_address, user_agent, 
        device_fingerprint, details
    )
    VALUES (
        p_user_id, v_session_id, 'authorize', p_lesson_id, p_course_id, 
        p_provider, p_provider_video_id, p_ip_address, p_user_agent, 
        p_device_fingerprint, jsonb_build_object('revoked_previous', v_revoked_count)
    );

    -- Retornar dados da sessão
    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'session_token', v_session_token,
        'session_code', v_session_code,
        'expires_at', v_expires_at,
        'watermark', jsonb_build_object(
            'text', v_watermark_text,
            'hash', v_watermark_hash,
            'mode', 'moving'
        )
    );
END;
$$;