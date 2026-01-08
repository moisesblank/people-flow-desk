-- =====================================================
-- FIX: Remover funções duplicadas de register_video_violation
-- Causa raiz: 4 versões conflitantes causando erro PGRST203
-- =====================================================

-- 1. DROP de todas as versões existentes (diferentes assinaturas)
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, text, integer, text, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, uuid, text, integer, text, jsonb);

-- 2. CREATE única versão definitiva e canônica
CREATE OR REPLACE FUNCTION public.register_video_violation(
  p_session_id uuid,
  p_violation_type text,
  p_threat_score integer DEFAULT 0,
  p_device_fingerprint text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_lesson_id uuid;
  v_result jsonb;
BEGIN
  -- Buscar dados da sessão
  SELECT user_id, lesson_id INTO v_user_id, v_lesson_id
  FROM video_play_sessions
  WHERE id = p_session_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SESSION_NOT_FOUND'
    );
  END IF;

  -- Registrar violação no log
  INSERT INTO video_access_logs (
    user_id,
    lesson_id,
    session_id,
    event_type,
    threat_score,
    device_fingerprint,
    metadata
  ) VALUES (
    v_user_id,
    v_lesson_id,
    p_session_id,
    p_violation_type,
    p_threat_score,
    p_device_fingerprint,
    p_metadata
  );

  -- Incrementar contador de violações na sessão
  UPDATE video_play_sessions
  SET 
    violations_count = COALESCE(violations_count, 0) + 1,
    last_violation_at = NOW(),
    threat_score = GREATEST(COALESCE(threat_score, 0), p_threat_score)
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'violation_type', p_violation_type,
    'registered_at', NOW()
  );
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.register_video_violation(uuid, text, integer, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_video_violation(uuid, text, integer, text, jsonb) TO service_role;