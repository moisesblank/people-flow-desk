-- ============================================
-- 🛡️ MIGRATION: Fix search_path - DROP and recreate SNA functions
-- ============================================

-- Drop and recreate SNA cache functions with correct parameter names
DROP FUNCTION IF EXISTS public.sna_cache_get(text);

CREATE FUNCTION public.sna_cache_get(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT value INTO v_result
  FROM public.sna_cache
  WHERE key = p_key
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_result IS NOT NULL THEN
    UPDATE public.sna_cache SET hit_count = hit_count + 1 WHERE key = p_key;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Recreate other functions that might have signature issues
DROP FUNCTION IF EXISTS public.end_video_session_omega(uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.register_video_violation_omega(uuid, text, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.video_session_heartbeat_omega(uuid, integer, text);

-- Recreate end_video_session_omega
CREATE FUNCTION public.end_video_session_omega(
  p_session_id UUID,
  p_reason TEXT DEFAULT 'USER_EXIT',
  p_final_position INTEGER DEFAULT 0,
  p_total_watched INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
BEGIN
  UPDATE public.video_play_sessions
  SET 
    ended_at = now(),
    final_position_seconds = p_final_position,
    total_watched_seconds = p_total_watched,
    revoke_reason = CASE WHEN p_reason != 'USER_EXIT' THEN p_reason ELSE NULL END
  WHERE id = p_session_id
    AND ended_at IS NULL
  RETURNING * INTO v_session;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found or already ended');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'session_id', p_session_id);
END;
$$;

-- Recreate register_video_violation_omega
CREATE FUNCTION public.register_video_violation_omega(
  p_session_id UUID,
  p_violation_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_severity INTEGER DEFAULT 10,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_violation_id UUID;
  v_new_score INTEGER;
BEGIN
  SELECT * INTO v_session FROM public.video_play_sessions WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  INSERT INTO public.video_violations (
    session_id, user_id, video_id, violation_type, description, 
    device_fingerprint, severity, metadata
  )
  VALUES (
    p_session_id, v_session.user_id, v_session.video_id, p_violation_type, 
    p_description, p_device_fingerprint, p_severity, p_metadata
  )
  RETURNING id INTO v_violation_id;
  
  INSERT INTO public.video_user_risk_scores (user_id, current_score)
  VALUES (v_session.user_id, p_severity)
  ON CONFLICT (user_id) DO UPDATE SET
    current_score = LEAST(100, video_user_risk_scores.current_score + p_severity),
    total_violations = video_user_risk_scores.total_violations + 1,
    last_violation_at = now();
  
  SELECT current_score INTO v_new_score 
  FROM public.video_user_risk_scores 
  WHERE user_id = v_session.user_id;
  
  IF v_new_score >= 80 THEN
    UPDATE public.video_play_sessions
    SET revoked_at = now(), revoke_reason = 'HIGH_RISK_SCORE'
    WHERE id = p_session_id AND revoked_at IS NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'violation_id', v_violation_id,
    'new_risk_score', v_new_score
  );
END;
$$;

-- Recreate video_session_heartbeat_omega
CREATE FUNCTION public.video_session_heartbeat_omega(
  p_session_id UUID,
  p_current_position INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'playing'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
BEGIN
  UPDATE public.video_play_sessions
  SET 
    last_heartbeat_at = now(),
    current_position_seconds = p_current_position,
    heartbeat_count = heartbeat_count + 1
  WHERE id = p_session_id
    AND ended_at IS NULL
    AND revoked_at IS NULL
  RETURNING * INTO v_session;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session invalid or expired');
  END IF;
  
  IF v_session.expires_at < now() THEN
    UPDATE public.video_play_sessions
    SET revoked_at = now(), revoke_reason = 'EXPIRED'
    WHERE id = p_session_id;
    
    RETURN jsonb_build_object('success', false, 'error', 'Session expired');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'expires_at', v_session.expires_at);
END;
$$;