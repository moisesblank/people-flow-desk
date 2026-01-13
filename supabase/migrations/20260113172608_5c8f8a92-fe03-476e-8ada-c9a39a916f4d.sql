-- =============================================
-- FIX: register_video_violation using wrong column name
-- Changes 'event_type' to 'action' to match video_access_logs schema
-- =============================================

CREATE OR REPLACE FUNCTION public.register_video_violation(
  p_session_token text, 
  p_violation_type text, 
  p_severity integer DEFAULT 1, 
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id uuid;
  v_user_id uuid;
  v_lesson_id uuid;
  v_current_score integer;
  v_new_score integer;
  v_action_taken text := 'none';
  v_revoke boolean := false;
BEGIN
  -- Buscar sessão pelo token
  SELECT id, user_id, lesson_id, COALESCE(risk_score, 0)
  INTO v_session_id, v_user_id, v_lesson_id, v_current_score
  FROM video_play_sessions
  WHERE session_token = p_session_token
  AND status = 'active';

  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SESSION_NOT_FOUND'
    );
  END IF;

  -- Calcular novo score (severity * 10)
  v_new_score := v_current_score + (p_severity * 10);

  -- Determinar ação baseada no score
  IF v_new_score >= 200 THEN
    v_action_taken := 'revoke';
    v_revoke := true;
  ELSIF v_new_score >= 100 THEN
    v_action_taken := 'pause';
  ELSIF v_new_score >= 60 THEN
    v_action_taken := 'degrade';
  ELSIF v_new_score >= 30 THEN
    v_action_taken := 'warn';
  END IF;

  -- Registrar violação no log usando coluna correta 'action'
  BEGIN
    INSERT INTO video_access_logs (
      user_id,
      lesson_id,
      session_id,
      action,
      details
    ) VALUES (
      v_user_id,
      v_lesson_id,
      v_session_id::text,
      'warn'::video_action_type,
      jsonb_build_object(
        'violation_type', p_violation_type,
        'severity', p_severity,
        'threat_score', v_new_score,
        'original_details', p_details
      )
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
  END;

  -- Atualizar sessão
  UPDATE video_play_sessions
  SET 
    violations_count = COALESCE(violations_count, 0) + 1,
    last_violation_at = NOW(),
    risk_score = v_new_score,
    status = CASE WHEN v_revoke THEN 'revoked'::video_session_status ELSE status END,
    revoked_at = CASE WHEN v_revoke THEN NOW() ELSE revoked_at END,
    revoke_reason = CASE WHEN v_revoke THEN 'VIOLATION_THRESHOLD' ELSE revoke_reason END
  WHERE id = v_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'violation_type', p_violation_type,
    'new_risk_score', v_new_score,
    'action_taken', v_action_taken,
    'session_revoked', v_revoke
  );
END;
$function$;