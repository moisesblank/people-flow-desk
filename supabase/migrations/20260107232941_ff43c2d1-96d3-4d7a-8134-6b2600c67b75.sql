-- Corrigir a função create_video_session - usar colunas corretas da tabela profiles
DROP FUNCTION IF EXISTS public.create_video_session(uuid, uuid, uuid, text, text, text, text, text, integer);

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
  v_expires_at timestamptz;
  v_watermark_text text;
  v_user_name text;
  v_user_cpf text;
  v_formatted_cpf text;
BEGIN
  -- Gerar token e timestamps
  v_session_id := gen_random_uuid();
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_ttl_minutes || ' minutes')::interval;
  
  -- Buscar dados do usuário para watermark (usando colunas corretas: name ou nome)
  SELECT 
    COALESCE(p.name, p.nome, split_part(au.email, '@', 1)),
    p.cpf
  INTO v_user_name, v_user_cpf
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.id = p_user_id;
  
  -- Formatar CPF COMPLETO (sem máscara) para watermark forense
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
  
  -- Inserir sessão
  INSERT INTO public.video_play_sessions (
    id,
    user_id,
    lesson_id,
    course_id,
    session_token,
    provider,
    provider_video_id,
    watermark_text,
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
    p_provider,
    p_provider_video_id,
    v_watermark_text,
    p_ip_address,
    p_user_agent,
    p_device_fingerprint,
    v_expires_at,
    'active'
  );
  
  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'session_token', v_session_token,
    'expires_at', v_expires_at,
    'watermark_text', v_watermark_text
  );
END;
$$;