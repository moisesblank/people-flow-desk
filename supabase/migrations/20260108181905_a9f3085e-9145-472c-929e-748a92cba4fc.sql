-- =====================================================
-- FIX DEFINITIVO: register_video_violation
-- CAUSA RAIZ: Frontend chama com p_session_token (text)
-- A função anterior usava p_session_id (uuid)
-- =====================================================

-- 1. DROP de TODAS as versões existentes (todas as assinaturas possíveis)
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, text, integer, text, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(uuid, uuid, text, integer, text, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.register_video_violation(text, text, integer, jsonb, text, text, text);
DROP FUNCTION IF EXISTS public.register_video_violation(text, public.video_violation_type, integer, jsonb, text, inet, text);

-- 2. CREATE função ÚNICA com assinatura que o FRONTEND espera
-- Frontend em useVideoFortress.ts linha 404-409 chama:
-- supabase.rpc('register_video_violation', {
--   p_session_token: sessionTokenRef.current,
--   p_violation_type: type,
--   p_severity: severity,
--   p_details: details || null,
-- });

CREATE OR REPLACE FUNCTION public.register_video_violation(
  p_session_token text,
  p_violation_type text,
  p_severity integer DEFAULT 1,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_user_id uuid;
  v_lesson_id uuid;
  v_current_score integer;
  v_new_score integer;
  v_action text := 'none';
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
    v_action := 'revoke';
    v_revoke := true;
  ELSIF v_new_score >= 100 THEN
    v_action := 'pause';
  ELSIF v_new_score >= 60 THEN
    v_action := 'degrade';
  ELSIF v_new_score >= 30 THEN
    v_action := 'warn';
  END IF;

  -- Registrar violação no log (se tabela existir)
  BEGIN
    INSERT INTO video_access_logs (
      user_id,
      lesson_id,
      session_id,
      event_type,
      threat_score,
      metadata
    ) VALUES (
      v_user_id,
      v_lesson_id,
      v_session_id,
      p_violation_type,
      p_severity,
      p_details
    );
  EXCEPTION WHEN undefined_table THEN
    -- Tabela não existe, ignorar
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
    'action_taken', v_action,
    'session_revoked', v_revoke
  );
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.register_video_violation(text, text, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_video_violation(text, text, integer, jsonb) TO service_role;