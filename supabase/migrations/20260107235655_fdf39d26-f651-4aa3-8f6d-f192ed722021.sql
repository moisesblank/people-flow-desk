-- Correção CIRÚRGICA: Apenas a linha do session_code
-- Substitui gen_random_bytes por gen_random_uuid para garantir unicidade absoluta

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
  v_session_token := encode(gen_random_bytes(32), 'hex');
  
  -- ✅ CORREÇÃO ÚNICA: Usar UUID para garantir unicidade absoluta
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
    expires_at,
    status
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
    p_ip_address,
    p_user_agent,
    p_device_fingerprint,
    v_expires_at,
    'active'
  );
  
  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'session_token', v_session_token,
    'session_code', v_session_code,
    'expires_at', v_expires_at,
    'watermark_text', v_watermark_text
  );
END;
$$;