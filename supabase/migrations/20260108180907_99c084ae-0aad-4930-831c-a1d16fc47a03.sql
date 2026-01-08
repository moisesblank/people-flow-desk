-- ============================================
-- 🛡️ CORREÇÃO P0: Token com timestamp para unicidade absoluta
-- Versão: 12.0 — Elimina duplicate key 23505
-- ============================================

CREATE OR REPLACE FUNCTION public.create_video_session(
  p_user_id uuid,
  p_lesson_id uuid,
  p_course_id uuid,
  p_provider text,
  p_provider_video_id text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL,
  p_ttl_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_session_token text;
  v_session_code text;
  v_watermark_hash text;
  v_expires_at timestamptz;
  v_watermark_text text;
  v_user_name text;
  v_user_cpf text;
  v_formatted_cpf text;
BEGIN
  -- Gerar IDs e tokens
  v_session_id := gen_random_uuid();
  
  -- ✅ v12.0 FIX: Token com UUID + timestamp + random para unicidade ABSOLUTA
  v_session_token := encode(gen_random_bytes(32), 'hex') || '-' || 
                     extract(epoch from clock_timestamp())::text || '-' ||
                     substr(md5(random()::text), 1, 8);
  
  -- ✅ Session code único com UUID
  v_session_code := 'VS-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  
  v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;
  
  -- Buscar dados do usuário para watermark
  SELECT 
    COALESCE(p.nome, split_part(au.email, '@', 1)),
    p.cpf
  INTO v_user_name, v_user_cpf
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.id = p_user_id;
  
  -- Formatar CPF COMPLETO para watermark forense
  IF v_user_cpf IS NOT NULL AND length(regexp_replace(v_user_cpf, '\D', '', 'g')) = 11 THEN
    v_formatted_cpf := substr(regexp_replace(v_user_cpf, '\D', '', 'g'), 1, 3) || '.' ||
                       substr(regexp_replace(v_user_cpf, '\D', '', 'g'), 4, 3) || '.' ||
                       substr(regexp_replace(v_user_cpf, '\D', '', 'g'), 7, 3) || '-' ||
                       substr(regexp_replace(v_user_cpf, '\D', '', 'g'), 10, 2);
  ELSE
    v_formatted_cpf := '';
  END IF;
  
  -- Montar texto do watermark: NOME • CPF_COMPLETO • CÓDIGO
  v_watermark_text := COALESCE(v_user_name, 'Usuário') || ' • ' || 
                      v_formatted_cpf || ' • ' ||
                      'MM-' || upper(substr(v_session_token, 1, 4));
  
  -- Gerar hash do watermark
  v_watermark_hash := encode(sha256(v_watermark_text::bytea), 'hex');
  
  -- Inserir sessão (com TODAS as colunas NOT NULL)
  INSERT INTO public.video_play_sessions (
    id,
    user_id,
    lesson_id,
    course_id,
    session_token,
    session_code,
    watermark_text,
    watermark_hash,
    provider,
    provider_video_id,
    ip_address,
    user_agent,
    device_fingerprint,
    status,
    created_at,
    last_heartbeat_at,
    expires_at,
    risk_score,
    violation_count,
    heartbeat_count,
    sanctum_immune,
    total_watch_seconds,
    max_position_seconds,
    completion_percentage
  ) VALUES (
    v_session_id,
    p_user_id,
    p_lesson_id,
    p_course_id,
    v_session_token,
    v_session_code,
    v_watermark_text,
    v_watermark_hash,
    p_provider,
    p_provider_video_id,
    COALESCE(p_ip_address, '0.0.0.0')::inet,
    COALESCE(p_user_agent, 'unknown'),
    COALESCE(p_device_fingerprint, 'unknown'),
    'active',
    now(),
    now(),
    v_expires_at,
    0,
    0,
    0,
    false,
    0,
    0,
    0
  );

  -- Retornar dados da sessão
  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'session_code', v_session_code,
    'session_token', v_session_token,
    'expires_at', v_expires_at,
    'watermark_text', v_watermark_text,
    'watermark_hash', v_watermark_hash,
    'revoked_previous', 0
  );
END;
$$;