-- Apenas adicionar/atualizar as funções (tabela já existe)

-- Função para atualizar trust score
CREATE OR REPLACE FUNCTION public.update_device_trust_score(
  p_user_id UUID,
  p_device_hash TEXT,
  p_adjustment INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_score INTEGER;
  v_current_score INTEGER;
BEGIN
  SELECT trust_score INTO v_current_score
  FROM device_trust_scores
  WHERE user_id = p_user_id AND device_hash = p_device_hash;
  
  IF v_current_score IS NULL THEN
    RETURN -1;
  END IF;
  
  v_new_score := GREATEST(0, LEAST(100, v_current_score + p_adjustment));
  
  UPDATE device_trust_scores
  SET 
    trust_score = v_new_score,
    is_trusted = (v_new_score >= 70),
    suspicious_events = CASE WHEN p_adjustment < 0 THEN suspicious_events + 1 ELSE suspicious_events END,
    updated_at = now()
  WHERE user_id = p_user_id AND device_hash = p_device_hash;
  
  RETURN v_new_score;
END;
$$;

-- Função para registrar dispositivo confiável
CREATE OR REPLACE FUNCTION public.register_device_trust(
  p_user_id UUID,
  p_device_hash TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS TABLE(trust_score INTEGER, is_new BOOLEAN, is_trusted BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_is_new BOOLEAN := false;
  v_trust_score INTEGER;
  v_is_trusted BOOLEAN;
BEGIN
  SELECT * INTO v_existing
  FROM device_trust_scores dts
  WHERE dts.user_id = p_user_id AND dts.device_hash = p_device_hash;
  
  IF v_existing IS NULL THEN
    INSERT INTO device_trust_scores (
      user_id, device_hash, device_name, device_type, 
      browser, os, last_ip_hash, last_country, 
      trust_score, total_sessions, is_trusted
    )
    VALUES (
      p_user_id, p_device_hash, p_device_name, p_device_type,
      p_browser, p_os, p_ip_hash, p_country,
      50, 1, false
    )
    RETURNING device_trust_scores.trust_score, device_trust_scores.is_trusted 
    INTO v_trust_score, v_is_trusted;
    
    v_is_new := true;
  ELSE
    v_trust_score := LEAST(100, v_existing.trust_score + 2);
    v_is_trusted := (v_trust_score >= 70);
    
    UPDATE device_trust_scores
    SET 
      trust_score = v_trust_score,
      is_trusted = v_is_trusted,
      total_sessions = total_sessions + 1,
      last_seen_at = now(),
      last_ip_hash = COALESCE(p_ip_hash, last_ip_hash),
      last_country = COALESCE(p_country, last_country),
      updated_at = now()
    WHERE user_id = p_user_id AND device_hash = p_device_hash;
  END IF;
  
  RETURN QUERY SELECT v_trust_score, v_is_new, v_is_trusted;
END;
$$;

-- Função para calcular risk score de dispositivo
CREATE OR REPLACE FUNCTION public.calculate_device_risk_score(
  p_user_id UUID,
  p_device_hash TEXT,
  p_current_country TEXT DEFAULT NULL
)
RETURNS TABLE(risk_score INTEGER, risk_factors JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_risk_score INTEGER := 0;
  v_risk_factors JSONB := '[]'::JSONB;
  v_recent_sessions INTEGER;
BEGIN
  SELECT * INTO v_device
  FROM device_trust_scores dts
  WHERE dts.user_id = p_user_id AND dts.device_hash = p_device_hash;
  
  IF v_device IS NULL THEN
    v_risk_score := v_risk_score + 30;
    v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'new_device', 'score', 30);
  ELSE
    IF v_device.trust_score < 30 THEN
      v_risk_score := v_risk_score + 25;
      v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'low_trust', 'score', 25);
    ELSIF v_device.trust_score < 50 THEN
      v_risk_score := v_risk_score + 10;
      v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'medium_trust', 'score', 10);
    END IF;
    
    IF v_device.suspicious_events >= 5 THEN
      v_risk_score := v_risk_score + 40;
      v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'many_suspicious_events', 'score', 40);
    ELSIF v_device.suspicious_events >= 2 THEN
      v_risk_score := v_risk_score + 15;
      v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'some_suspicious_events', 'score', 15);
    END IF;
    
    IF p_current_country IS NOT NULL AND v_device.last_country IS NOT NULL 
       AND p_current_country != v_device.last_country THEN
      v_risk_score := v_risk_score + 20;
      v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'country_change', 'score', 20);
    END IF;
  END IF;
  
  SELECT COUNT(*) INTO v_recent_sessions
  FROM active_sessions
  WHERE user_id = p_user_id 
    AND created_at > now() - interval '1 hour'
    AND status = 'active';
  
  IF v_recent_sessions >= 3 THEN
    v_risk_score := v_risk_score + 30;
    v_risk_factors := v_risk_factors || jsonb_build_object('factor', 'many_recent_sessions', 'score', 30);
  END IF;
  
  v_risk_score := LEAST(100, v_risk_score);
  
  RETURN QUERY SELECT v_risk_score, v_risk_factors;
END;
$$;