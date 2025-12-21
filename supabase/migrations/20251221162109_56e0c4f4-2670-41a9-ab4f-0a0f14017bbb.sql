-- ============================================
-- 🛡️ DOGMA XI v2.0: SISTEMA COMPLETO DE DISPOSITIVOS
-- Máx 3 dispositivos + Sessão única + Logs completos
-- ============================================

-- Tabela de tentativas bloqueadas (para auditoria)
CREATE TABLE IF NOT EXISTS public.device_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  attempt_type TEXT NOT NULL, -- 'DEVICE_LIMIT_EXCEEDED', 'SIMULTANEOUS_ACCESS', 'NEW_DEVICE_BLOCKED'
  blocked BOOLEAN DEFAULT true,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  ip_hint TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tentativas
CREATE INDEX IF NOT EXISTS idx_device_attempts_user ON public.device_access_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_device_attempts_created ON public.device_access_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_attempts_unresolved ON public.device_access_attempts(user_id, resolved) WHERE NOT resolved;

-- RLS para tentativas
ALTER TABLE public.device_access_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_attempts_owner_only"
ON public.device_access_attempts FOR ALL
USING (public.check_is_owner_email(auth.uid()));

-- ============================================
-- FUNÇÃO MELHORADA: Registrar dispositivo com limite + logs
-- ============================================
CREATE OR REPLACE FUNCTION public.register_device_with_limit(
  p_device_fingerprint TEXT, 
  p_device_name TEXT, 
  p_device_type TEXT DEFAULT 'desktop', 
  p_browser TEXT DEFAULT NULL, 
  p_os TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_owner BOOLEAN;
  v_device_count INTEGER;
  v_existing_device UUID;
  v_new_device UUID;
  v_devices JSONB;
  v_active_session BOOLEAN;
BEGIN
  -- Validação básica
  IF v_user_id IS NULL THEN 
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;
  
  -- Verificar se é owner
  v_is_owner := public.check_is_owner_email(v_user_id);
  
  -- Verificar se já existe dispositivo ativo com mesmo fingerprint
  SELECT id INTO v_existing_device 
  FROM public.user_devices 
  WHERE user_id = v_user_id 
    AND device_fingerprint = p_device_fingerprint 
    AND is_active = true;
  
  IF v_existing_device IS NOT NULL THEN
    -- Atualizar last_seen e retornar sucesso
    UPDATE public.user_devices 
    SET last_seen_at = NOW(),
        device_name = p_device_name,
        browser = COALESCE(p_browser, browser),
        os = COALESCE(p_os, os)
    WHERE id = v_existing_device;
    
    -- Invalidar outras sessões ativas deste usuário (DOGMA I)
    -- Mantém apenas a sessão atual
    UPDATE public.user_sessions 
    SET is_active = false, logout_at = NOW()
    WHERE user_id = v_user_id 
      AND is_active = true;
    
    RETURN jsonb_build_object(
      'success', true, 
      'device_id', v_existing_device, 
      'status', 'EXISTING_DEVICE',
      'is_owner', v_is_owner,
      'message', 'Dispositivo reconhecido'
    );
  END IF;
  
  -- Contar dispositivos ativos do usuário
  SELECT COUNT(*) INTO v_device_count 
  FROM public.user_devices 
  WHERE user_id = v_user_id AND is_active = true;
  
  -- Verificar limite (3 dispositivos, exceto owner)
  IF NOT v_is_owner AND v_device_count >= 3 THEN
    -- Registrar tentativa bloqueada
    INSERT INTO public.device_access_attempts (
      user_id, device_fingerprint, device_name, device_type, 
      browser, os, attempt_type, blocked
    ) VALUES (
      v_user_id, p_device_fingerprint, p_device_name, p_device_type,
      p_browser, p_os, 'DEVICE_LIMIT_EXCEEDED', true
    );
    
    -- Buscar dispositivos ativos para o modal
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id, 
        'device_name', device_name, 
        'device_type', device_type, 
        'browser', browser, 
        'os', os, 
        'last_seen_at', last_seen_at,
        'first_seen_at', first_seen_at,
        'is_current', false
      ) ORDER BY last_seen_at DESC
    ) INTO v_devices 
    FROM public.user_devices 
    WHERE user_id = v_user_id AND is_active = true;
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'DEVICE_LIMIT_EXCEEDED', 
      'max_devices', 3, 
      'current_count', v_device_count, 
      'devices', COALESCE(v_devices, '[]'::jsonb),
      'message', 'Você já possui 3 dispositivos ativos. Escolha um para desativar.'
    );
  END IF;
  
  -- Registrar novo dispositivo
  INSERT INTO public.user_devices (
    user_id, device_fingerprint, device_name, device_type, browser, os
  ) VALUES (
    v_user_id, p_device_fingerprint, p_device_name, p_device_type, p_browser, p_os
  ) 
  ON CONFLICT (user_id, device_fingerprint) 
  DO UPDATE SET 
    is_active = true, 
    last_seen_at = NOW(), 
    device_name = p_device_name,
    browser = COALESCE(p_browser, user_devices.browser),
    os = COALESCE(p_os, user_devices.os),
    deactivated_at = NULL,
    deactivated_by = NULL
  RETURNING id INTO v_new_device;
  
  -- Invalidar outras sessões ativas (DOGMA I: Sessão Única)
  UPDATE public.user_sessions 
  SET is_active = false, logout_at = NOW()
  WHERE user_id = v_user_id AND is_active = true;
  
  RETURN jsonb_build_object(
    'success', true, 
    'device_id', v_new_device,
    'status', 'NEW_DEVICE_REGISTERED', 
    'device_count', v_device_count + 1,
    'max_devices', CASE WHEN v_is_owner THEN 999 ELSE 3 END,
    'is_owner', v_is_owner,
    'message', 'Dispositivo registrado com sucesso'
  );
END;
$$;

-- ============================================
-- FUNÇÃO MELHORADA: Desativar dispositivo
-- ============================================
CREATE OR REPLACE FUNCTION public.deactivate_device(p_device_id UUID) 
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_device_owner UUID;
  v_device_name TEXT;
  v_device_fp TEXT;
  v_is_owner BOOLEAN;
BEGIN
  -- Buscar dados do dispositivo
  SELECT user_id, device_name, device_fingerprint 
  INTO v_device_owner, v_device_name, v_device_fp 
  FROM public.user_devices 
  WHERE id = p_device_id;
  
  IF v_device_owner IS NULL THEN 
    RETURN jsonb_build_object('success', false, 'error', 'DEVICE_NOT_FOUND');
  END IF;
  
  v_is_owner := public.check_is_owner_email(v_user_id);
  
  -- Verificar autorização
  IF NOT v_is_owner AND v_device_owner != v_user_id THEN 
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;
  
  -- Desativar dispositivo
  UPDATE public.user_devices 
  SET is_active = false, 
      deactivated_at = NOW(), 
      deactivated_by = v_user_id 
  WHERE id = p_device_id;
  
  -- Invalidar sessões deste dispositivo
  UPDATE public.user_sessions 
  SET is_active = false, logout_at = NOW() 
  WHERE user_id = v_device_owner 
    AND device_fingerprint = v_device_fp;
  
  -- Marcar tentativa como resolvida (se houver)
  UPDATE public.device_access_attempts
  SET resolved = true, resolved_at = NOW()
  WHERE user_id = v_device_owner 
    AND NOT resolved
    AND attempt_type = 'DEVICE_LIMIT_EXCEEDED';
  
  -- Log de auditoria
  INSERT INTO public.activity_log (user_id, action, table_name, record_id, new_value)
  VALUES (v_user_id, 'DEVICE_DEACTIVATED', 'user_devices', p_device_id::text,
    jsonb_build_object('device_name', v_device_name, 'deactivated_by_owner', v_is_owner)
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'device_name', v_device_name,
    'message', 'Dispositivo desativado com sucesso'
  );
END;
$$;

-- ============================================
-- FUNÇÃO: Admin - Obter todos dispositivos com detalhes
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_all_devices(
  p_limit INTEGER DEFAULT 100, 
  p_offset INTEGER DEFAULT 0,
  p_only_active BOOLEAN DEFAULT false
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  v_devices JSONB; 
  v_total INTEGER;
  v_active_count INTEGER;
  v_suspicious_count INTEGER;
BEGIN
  -- Apenas owner pode acessar
  IF NOT public.check_is_owner_email(auth.uid()) THEN 
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;
  
  -- Contagens
  SELECT COUNT(*) INTO v_total FROM public.user_devices;
  SELECT COUNT(*) INTO v_active_count FROM public.user_devices WHERE is_active = true;
  
  -- Usuários suspeitos (3+ dispositivos ativos)
  SELECT COUNT(DISTINCT user_id) INTO v_suspicious_count 
  FROM public.user_devices 
  WHERE is_active = true 
  GROUP BY user_id 
  HAVING COUNT(*) >= 3;
  
  -- Buscar dispositivos
  SELECT jsonb_agg(device_data ORDER BY last_seen_at DESC NULLS LAST)
  INTO v_devices
  FROM (
    SELECT jsonb_build_object(
      'id', ud.id, 
      'user_id', ud.user_id, 
      'user_email', au.email, 
      'device_name', ud.device_name, 
      'device_type', ud.device_type, 
      'browser', ud.browser, 
      'os', ud.os, 
      'is_active', ud.is_active,
      'is_trusted', ud.is_trusted,
      'first_seen_at', ud.first_seen_at,
      'last_seen_at', ud.last_seen_at,
      'deactivated_at', ud.deactivated_at,
      'active_count', (
        SELECT COUNT(*) 
        FROM public.user_devices 
        WHERE user_id = ud.user_id AND is_active = true
      )
    ) as device_data,
    ud.last_seen_at
    FROM public.user_devices ud 
    LEFT JOIN auth.users au ON ud.user_id = au.id
    WHERE (NOT p_only_active OR ud.is_active = true)
    ORDER BY ud.last_seen_at DESC NULLS LAST 
    LIMIT p_limit OFFSET p_offset
  ) sub;
  
  RETURN jsonb_build_object(
    'success', true, 
    'devices', COALESCE(v_devices, '[]'::jsonb), 
    'total', v_total,
    'active_count', v_active_count,
    'suspicious_count', COALESCE(v_suspicious_count, 0)
  );
END;
$$;

-- ============================================
-- FUNÇÃO: Admin - Obter tentativas bloqueadas
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_blocked_attempts(
  p_limit INTEGER DEFAULT 50,
  p_only_unresolved BOOLEAN DEFAULT true
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  v_attempts JSONB;
  v_total INTEGER;
BEGIN
  IF NOT public.check_is_owner_email(auth.uid()) THEN 
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;
  
  SELECT COUNT(*) INTO v_total 
  FROM public.device_access_attempts 
  WHERE (NOT p_only_unresolved OR NOT resolved);
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', daa.id,
      'user_email', au.email,
      'device_name', daa.device_name,
      'device_type', daa.device_type,
      'browser', daa.browser,
      'os', daa.os,
      'attempt_type', daa.attempt_type,
      'blocked', daa.blocked,
      'resolved', daa.resolved,
      'created_at', daa.created_at
    ) ORDER BY daa.created_at DESC
  ) INTO v_attempts
  FROM public.device_access_attempts daa
  LEFT JOIN auth.users au ON daa.user_id = au.id
  WHERE (NOT p_only_unresolved OR NOT daa.resolved)
  LIMIT p_limit;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempts', COALESCE(v_attempts, '[]'::jsonb),
    'total', v_total
  );
END;
$$;

-- ============================================
-- FUNÇÃO: Admin - Estatísticas em tempo real
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_device_stats() 
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_stats JSONB;
BEGIN
  IF NOT public.check_is_owner_email(auth.uid()) THEN 
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;
  
  SELECT jsonb_build_object(
    'total_devices', (SELECT COUNT(*) FROM public.user_devices),
    'active_devices', (SELECT COUNT(*) FROM public.user_devices WHERE is_active = true),
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM public.user_devices),
    'users_at_limit', (
      SELECT COUNT(*) FROM (
        SELECT user_id FROM public.user_devices 
        WHERE is_active = true 
        GROUP BY user_id HAVING COUNT(*) >= 3
      ) sub
    ),
    'recent_attempts', (
      SELECT COUNT(*) FROM public.device_access_attempts 
      WHERE created_at > NOW() - INTERVAL '24 hours' AND blocked = true
    ),
    'devices_by_type', (
      SELECT jsonb_object_agg(device_type, cnt)
      FROM (
        SELECT COALESCE(device_type, 'unknown') as device_type, COUNT(*) as cnt
        FROM public.user_devices WHERE is_active = true
        GROUP BY device_type
      ) sub
    ),
    'online_now', (
      SELECT COUNT(*) FROM public.user_devices 
      WHERE is_active = true AND last_seen_at > NOW() - INTERVAL '5 minutes'
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- Realtime para tentativas
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_access_attempts;