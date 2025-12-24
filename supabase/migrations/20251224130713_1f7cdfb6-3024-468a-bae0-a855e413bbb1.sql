-- ============================================
-- ATUALIZAR FUNÇÕES PARA COMPATIBILIDADE COM EDGE FUNCTIONS
-- LEI III + LEI VI: Segurança Dispositivos PhD
-- ============================================

-- 1. Dropar funções antigas para recriar com assinaturas corretas
DROP FUNCTION IF EXISTS public.calculate_device_risk_score(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.calculate_device_risk_score(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.register_device_trust(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.register_device_trust(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT);

-- 2. Função calculate_device_risk_score COMPLETA (5 parâmetros)
CREATE OR REPLACE FUNCTION public.calculate_device_risk_score(
  p_user_id UUID,
  p_device_hash TEXT,
  p_ip TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_risk_score INTEGER := 0;
  v_reasons JSONB := '[]'::JSONB;
  v_recent_sessions INTEGER;
  v_is_new_device BOOLEAN := false;
  v_country_changed BOOLEAN := false;
  v_rapid_change BOOLEAN := false;
  v_last_seen_minutes INTEGER;
BEGIN
  -- Buscar dados do dispositivo
  SELECT * INTO v_device
  FROM device_trust_scores dts
  WHERE dts.user_id = p_user_id AND dts.device_hash = p_device_hash;
  
  -- ============================================
  -- ANÁLISE DO DISPOSITIVO
  -- ============================================
  
  IF v_device IS NULL THEN
    -- Dispositivo novo = maior risco
    v_is_new_device := true;
    v_risk_score := v_risk_score + 30;
    v_reasons := v_reasons || jsonb_build_object('reason', 'new_device', 'points', 30);
  ELSE
    -- Verificar trust_score
    IF v_device.trust_score < 30 THEN
      v_risk_score := v_risk_score + 25;
      v_reasons := v_reasons || jsonb_build_object('reason', 'low_trust_score', 'points', 25);
    ELSIF v_device.trust_score < 50 THEN
      v_risk_score := v_risk_score + 10;
      v_reasons := v_reasons || jsonb_build_object('reason', 'medium_trust_score', 'points', 10);
    END IF;
    
    -- Verificar eventos suspeitos anteriores
    IF v_device.suspicious_events >= 5 THEN
      v_risk_score := v_risk_score + 40;
      v_reasons := v_reasons || jsonb_build_object('reason', 'many_suspicious_events', 'points', 40);
    ELSIF v_device.suspicious_events >= 2 THEN
      v_risk_score := v_risk_score + 15;
      v_reasons := v_reasons || jsonb_build_object('reason', 'some_suspicious_events', 'points', 15);
    END IF;
    
    -- Verificar mudança de país
    IF p_country IS NOT NULL AND v_device.last_country IS NOT NULL 
       AND p_country != v_device.last_country THEN
      v_country_changed := true;
      
      -- Verificar se é mudança rápida (menos de 2 horas desde última atividade)
      IF v_device.last_seen_at IS NOT NULL THEN
        v_last_seen_minutes := EXTRACT(EPOCH FROM (now() - v_device.last_seen_at)) / 60;
        
        IF v_last_seen_minutes < 120 THEN
          -- Mudança de país em menos de 2 horas = muito suspeito (VPN/proxy ou conta compartilhada)
          v_rapid_change := true;
          v_risk_score := v_risk_score + 50;
          v_reasons := v_reasons || jsonb_build_object('reason', 'rapid_country_change', 'points', 50);
        ELSE
          v_risk_score := v_risk_score + 20;
          v_reasons := v_reasons || jsonb_build_object('reason', 'country_change', 'points', 20);
        END IF;
      ELSE
        v_risk_score := v_risk_score + 20;
        v_reasons := v_reasons || jsonb_build_object('reason', 'country_change', 'points', 20);
      END IF;
    END IF;
    
    -- Verificar se dispositivo está bloqueado
    IF v_device.is_blocked THEN
      v_risk_score := 100;
      v_reasons := v_reasons || jsonb_build_object('reason', 'device_blocked', 'points', 100);
    END IF;
  END IF;
  
  -- ============================================
  -- ANÁLISE DE SESSÕES RECENTES
  -- ============================================
  
  SELECT COUNT(*) INTO v_recent_sessions
  FROM active_sessions
  WHERE user_id = p_user_id 
    AND created_at > now() - interval '1 hour'
    AND status = 'active';
  
  IF v_recent_sessions >= 5 THEN
    v_risk_score := v_risk_score + 40;
    v_reasons := v_reasons || jsonb_build_object('reason', 'too_many_recent_sessions', 'points', 40);
  ELSIF v_recent_sessions >= 3 THEN
    v_risk_score := v_risk_score + 20;
    v_reasons := v_reasons || jsonb_build_object('reason', 'many_recent_sessions', 'points', 20);
  END IF;
  
  -- ============================================
  -- ANÁLISE DE USER-AGENT
  -- ============================================
  
  IF p_user_agent IS NOT NULL THEN
    IF p_user_agent = '' OR LENGTH(p_user_agent) < 10 THEN
      v_risk_score := v_risk_score + 20;
      v_reasons := v_reasons || jsonb_build_object('reason', 'suspicious_user_agent', 'points', 20);
    END IF;
  END IF;
  
  -- Limitar a 100
  v_risk_score := LEAST(100, v_risk_score);
  
  -- Retornar resultado completo
  RETURN jsonb_build_object(
    'risk_score', v_risk_score,
    'is_new_device', v_is_new_device,
    'country_changed', v_country_changed,
    'rapid_change', v_rapid_change,
    'reasons', v_reasons,
    'device_trust_score', COALESCE(v_device.trust_score, 0),
    'device_is_trusted', COALESCE(v_device.is_trusted, false),
    'device_is_blocked', COALESCE(v_device.is_blocked, false)
  );
END;
$$;

-- 3. Função register_device_trust COMPLETA (10 parâmetros)
CREATE OR REPLACE FUNCTION public.register_device_trust(
  p_user_id UUID,
  p_device_hash TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_fingerprint JSONB DEFAULT '{}'::JSONB,
  p_ip TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_is_new BOOLEAN := false;
  v_trust_score INTEGER;
  v_is_trusted BOOLEAN;
  v_device_id UUID;
BEGIN
  -- Buscar dispositivo existente
  SELECT * INTO v_existing
  FROM device_trust_scores dts
  WHERE dts.user_id = p_user_id AND dts.device_hash = p_device_hash;
  
  IF v_existing IS NULL THEN
    -- Novo dispositivo: inserir com trust_score inicial de 50
    INSERT INTO device_trust_scores (
      user_id, device_hash, device_name, device_type, 
      browser, os, fingerprint_data, last_ip, last_country, last_city,
      trust_score, total_sessions, successful_logins, is_trusted
    )
    VALUES (
      p_user_id, p_device_hash, p_device_name, p_device_type,
      p_browser, p_os, p_fingerprint, p_ip, p_country, p_city,
      50, 1, 1, false
    )
    RETURNING id, trust_score, is_trusted 
    INTO v_device_id, v_trust_score, v_is_trusted;
    
    v_is_new := true;
  ELSE
    -- Dispositivo existente: aumentar trust_score
    v_trust_score := LEAST(100, v_existing.trust_score + 2);
    v_is_trusted := (v_trust_score >= 70);
    v_device_id := v_existing.id;
    
    -- Atualizar IP history se IP mudou
    UPDATE device_trust_scores
    SET 
      trust_score = v_trust_score,
      is_trusted = v_is_trusted,
      total_sessions = total_sessions + 1,
      successful_logins = successful_logins + 1,
      last_seen_at = now(),
      last_login_at = now(),
      last_ip = COALESCE(p_ip, last_ip),
      last_country = COALESCE(p_country, last_country),
      last_city = COALESCE(p_city, last_city),
      fingerprint_data = CASE 
        WHEN p_fingerprint IS NOT NULL AND p_fingerprint != '{}'::JSONB 
        THEN p_fingerprint 
        ELSE fingerprint_data 
      END,
      ip_history = CASE
        WHEN p_ip IS NOT NULL AND p_ip != last_ip
        THEN ip_history || jsonb_build_object(
          'ip', p_ip, 
          'country', p_country, 
          'city', p_city,
          'timestamp', now()
        )
        ELSE ip_history
      END,
      updated_at = now()
    WHERE id = v_device_id;
  END IF;
  
  RETURN jsonb_build_object(
    'device_id', v_device_id,
    'trust_score', v_trust_score,
    'is_new', v_is_new,
    'is_trusted', v_is_trusted
  );
END;
$$;

-- 4. Verificar e atualizar log_suspicious_device_event se necessário
CREATE OR REPLACE FUNCTION public.log_suspicious_device_event(
  p_user_id UUID,
  p_device_hash TEXT,
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_ip TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_action_taken TEXT DEFAULT 'logged'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_trust_id UUID;
  v_event_id UUID;
BEGIN
  -- Buscar device_trust_id
  SELECT id INTO v_device_trust_id
  FROM device_trust_scores
  WHERE user_id = p_user_id AND device_hash = p_device_hash;
  
  -- Inserir evento
  INSERT INTO device_suspicious_events (
    device_trust_id, user_id, event_type, severity, description,
    metadata, ip_address, country_code, user_agent, action_taken
  ) VALUES (
    v_device_trust_id, p_user_id, p_event_type, p_severity, p_description,
    p_metadata, p_ip, p_country, p_user_agent, p_action_taken
  )
  RETURNING id INTO v_event_id;
  
  -- Incrementar contador de eventos suspeitos no dispositivo
  IF v_device_trust_id IS NOT NULL THEN
    UPDATE device_trust_scores
    SET 
      suspicious_events = suspicious_events + 1,
      -- Reduzir trust_score baseado na severidade
      trust_score = GREATEST(0, trust_score - CASE p_severity
        WHEN 'critical' THEN 30
        WHEN 'high' THEN 20
        WHEN 'medium' THEN 10
        WHEN 'low' THEN 5
        ELSE 5
      END),
      updated_at = now()
    WHERE id = v_device_trust_id;
  END IF;
  
  RETURN v_event_id;
END;
$$;

-- 5. Grants para edge functions
GRANT EXECUTE ON FUNCTION public.calculate_device_risk_score(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_device_trust(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_suspicious_device_event(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) TO service_role;