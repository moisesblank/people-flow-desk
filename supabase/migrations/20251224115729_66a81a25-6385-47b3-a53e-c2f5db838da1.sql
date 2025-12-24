-- ============================================
-- 🏛️ LEI VI + LEI III: TABELA DEVICE_TRUST_SCORES
-- Sistema de confiança de dispositivos
-- ============================================

-- Tabela principal de confiança de dispositivos
CREATE TABLE IF NOT EXISTS public.device_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_hash TEXT NOT NULL,
  
  -- Scores de confiança
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Informações do dispositivo
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Fingerprint estendido
  fingerprint_data JSONB DEFAULT '{}',
  
  -- Localização
  last_ip TEXT,
  last_country TEXT,
  last_city TEXT,
  ip_history JSONB DEFAULT '[]',
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  
  -- Estatísticas
  total_sessions INTEGER DEFAULT 0,
  successful_logins INTEGER DEFAULT 0,
  failed_logins INTEGER DEFAULT 0,
  suspicious_events INTEGER DEFAULT 0,
  
  -- Status
  is_trusted BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, device_hash)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_device_trust_user_id ON public.device_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_device_trust_hash ON public.device_trust_scores(device_hash);
CREATE INDEX IF NOT EXISTS idx_device_trust_score ON public.device_trust_scores(trust_score);
CREATE INDEX IF NOT EXISTS idx_device_trust_is_trusted ON public.device_trust_scores(is_trusted);
CREATE INDEX IF NOT EXISTS idx_device_trust_is_blocked ON public.device_trust_scores(is_blocked);

-- Tabela de eventos suspeitos
CREATE TABLE IF NOT EXISTS public.device_suspicious_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_trust_id UUID REFERENCES public.device_trust_scores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  event_type TEXT NOT NULL, -- 'country_change', 'ip_anomaly', 'rapid_location_change', 'vpn_detected', 'bot_detected'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Contexto
  ip_address TEXT,
  country_code TEXT,
  user_agent TEXT,
  
  -- Ação tomada
  action_taken TEXT, -- 'challenge', 'block', 'alert', 'none'
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_events_user ON public.device_suspicious_events(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_type ON public.device_suspicious_events(event_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_severity ON public.device_suspicious_events(severity);

-- Enable RLS
ALTER TABLE public.device_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_suspicious_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies para device_trust_scores
CREATE POLICY "Users can view their own device trust scores"
ON public.device_trust_scores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage all device trust scores"
ON public.device_trust_scores FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies para device_suspicious_events
CREATE POLICY "Users can view their own suspicious events"
ON public.device_suspicious_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage all suspicious events"
ON public.device_suspicious_events FOR ALL
USING (true)
WITH CHECK (true);

-- Função para calcular risk_score
CREATE OR REPLACE FUNCTION public.calculate_device_risk_score(
  p_user_id UUID,
  p_device_hash TEXT,
  p_ip TEXT,
  p_country TEXT,
  p_user_agent TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_reasons JSONB := '[]'::JSONB;
  v_device RECORD;
  v_last_country TEXT;
  v_last_seen TIMESTAMPTZ;
  v_is_new_device BOOLEAN := false;
  v_country_changed BOOLEAN := false;
  v_rapid_change BOOLEAN := false;
BEGIN
  -- Buscar dispositivo existente
  SELECT * INTO v_device
  FROM device_trust_scores
  WHERE user_id = p_user_id AND device_hash = p_device_hash;
  
  -- Dispositivo novo?
  IF NOT FOUND THEN
    v_is_new_device := true;
    v_risk_score := v_risk_score + 20;
    v_reasons := v_reasons || '{"reason": "new_device", "points": 20}'::JSONB;
  ELSE
    v_last_country := v_device.last_country;
    v_last_seen := v_device.last_seen_at;
    
    -- País mudou?
    IF v_last_country IS NOT NULL AND v_last_country != p_country THEN
      v_country_changed := true;
      
      -- Mudou em menos de 1 hora? (impossível viajar)
      IF v_last_seen > (now() - interval '1 hour') THEN
        v_rapid_change := true;
        v_risk_score := v_risk_score + 50;
        v_reasons := v_reasons || '{"reason": "rapid_country_change", "points": 50}'::JSONB;
      ELSE
        v_risk_score := v_risk_score + 15;
        v_reasons := v_reasons || '{"reason": "country_changed", "points": 15}'::JSONB;
      END IF;
    END IF;
    
    -- Muitos eventos suspeitos anteriores?
    IF v_device.suspicious_events > 5 THEN
      v_risk_score := v_risk_score + 30;
      v_reasons := v_reasons || '{"reason": "history_suspicious", "points": 30}'::JSONB;
    END IF;
    
    -- Dispositivo bloqueado?
    IF v_device.is_blocked THEN
      v_risk_score := 100;
      v_reasons := v_reasons || '{"reason": "device_blocked", "points": 100}'::JSONB;
    END IF;
    
    -- Bônus por dispositivo confiável
    IF v_device.is_trusted AND v_device.trust_score > 80 THEN
      v_risk_score := GREATEST(0, v_risk_score - 20);
      v_reasons := v_reasons || '{"reason": "trusted_device_bonus", "points": -20}'::JSONB;
    END IF;
  END IF;
  
  -- Verificar user-agent suspeito
  IF p_user_agent IS NULL OR p_user_agent = '' THEN
    v_risk_score := v_risk_score + 30;
    v_reasons := v_reasons || '{"reason": "empty_user_agent", "points": 30}'::JSONB;
  ELSIF p_user_agent ~* '(bot|crawler|spider|scraper)' THEN
    v_risk_score := v_risk_score + 25;
    v_reasons := v_reasons || '{"reason": "bot_user_agent", "points": 25}'::JSONB;
  END IF;
  
  -- Limitar a 100
  v_risk_score := LEAST(100, v_risk_score);
  
  RETURN jsonb_build_object(
    'risk_score', v_risk_score,
    'is_new_device', v_is_new_device,
    'country_changed', v_country_changed,
    'rapid_change', v_rapid_change,
    'reasons', v_reasons,
    'action', CASE
      WHEN v_risk_score >= 80 THEN 'block'
      WHEN v_risk_score >= 50 THEN 'challenge'
      WHEN v_risk_score >= 30 THEN 'monitor'
      ELSE 'allow'
    END
  );
END;
$$;

-- Função para registrar/atualizar dispositivo
CREATE OR REPLACE FUNCTION public.register_device_trust(
  p_user_id UUID,
  p_device_hash TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_fingerprint JSONB DEFAULT '{}',
  p_ip TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device RECORD;
  v_is_new BOOLEAN := false;
  v_ip_history JSONB;
BEGIN
  -- Buscar dispositivo existente
  SELECT * INTO v_device
  FROM device_trust_scores
  WHERE user_id = p_user_id AND device_hash = p_device_hash;
  
  IF NOT FOUND THEN
    v_is_new := true;
    v_ip_history := jsonb_build_array(
      jsonb_build_object('ip', p_ip, 'country', p_country, 'city', p_city, 'at', now())
    );
    
    INSERT INTO device_trust_scores (
      user_id, device_hash, device_name, device_type, browser, os,
      fingerprint_data, last_ip, last_country, last_city, ip_history,
      total_sessions, successful_logins
    ) VALUES (
      p_user_id, p_device_hash, p_device_name, p_device_type, p_browser, p_os,
      p_fingerprint, p_ip, p_country, p_city, v_ip_history,
      1, 1
    )
    RETURNING * INTO v_device;
  ELSE
    -- Atualizar histórico de IPs
    v_ip_history := v_device.ip_history;
    IF p_ip IS NOT NULL AND p_ip != v_device.last_ip THEN
      v_ip_history := v_ip_history || jsonb_build_array(
        jsonb_build_object('ip', p_ip, 'country', p_country, 'city', p_city, 'at', now())
      );
      -- Manter apenas últimos 20 IPs
      IF jsonb_array_length(v_ip_history) > 20 THEN
        v_ip_history := (SELECT jsonb_agg(elem) FROM (
          SELECT elem FROM jsonb_array_elements(v_ip_history) elem
          ORDER BY (elem->>'at')::timestamptz DESC
          LIMIT 20
        ) sub);
      END IF;
    END IF;
    
    UPDATE device_trust_scores SET
      device_name = COALESCE(p_device_name, device_name),
      device_type = COALESCE(p_device_type, device_type),
      browser = COALESCE(p_browser, browser),
      os = COALESCE(p_os, os),
      fingerprint_data = COALESCE(p_fingerprint, fingerprint_data),
      last_ip = COALESCE(p_ip, last_ip),
      last_country = COALESCE(p_country, last_country),
      last_city = COALESCE(p_city, last_city),
      ip_history = v_ip_history,
      last_seen_at = now(),
      last_login_at = now(),
      total_sessions = total_sessions + 1,
      successful_logins = successful_logins + 1,
      -- Aumentar trust_score gradualmente
      trust_score = LEAST(100, trust_score + 1),
      updated_at = now()
    WHERE id = v_device.id
    RETURNING * INTO v_device;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'is_new_device', v_is_new,
    'device_id', v_device.id,
    'trust_score', v_device.trust_score,
    'is_trusted', v_device.is_trusted,
    'is_blocked', v_device.is_blocked
  );
END;
$$;

-- Função para registrar evento suspeito
CREATE OR REPLACE FUNCTION public.log_suspicious_device_event(
  p_user_id UUID,
  p_device_hash TEXT,
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_ip TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_action_taken TEXT DEFAULT 'none'
) RETURNS UUID
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
        ELSE 5
      END),
      updated_at = now()
    WHERE id = v_device_trust_id;
  END IF;
  
  RETURN v_event_id;
END;
$$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_device_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_device_trust_updated_at ON public.device_trust_scores;
CREATE TRIGGER trigger_device_trust_updated_at
  BEFORE UPDATE ON public.device_trust_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_trust_updated_at();