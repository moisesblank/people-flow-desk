-- ============================================
-- 🛡️ Correção: Distinguir dispositivo registrado vs sessão ativa
-- Adiciona campo has_active_session no retorno do admin_get_all_devices
-- ============================================

-- Atualizar função admin_get_all_devices para incluir has_active_session
CREATE OR REPLACE FUNCTION public.admin_get_all_devices(
  p_limit INTEGER DEFAULT 500,
  p_offset INTEGER DEFAULT 0,
  p_only_active BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_devices JSONB; 
  v_total INTEGER;
BEGIN
  -- Verificar permissão (owner only)
  IF NOT public.check_is_owner_email(auth.uid()) THEN 
    RETURN '{"success":false,"error":"NOT_AUTHORIZED"}'::jsonb; 
  END IF;
  
  -- Contar total
  SELECT COUNT(*) INTO v_total 
  FROM public.user_devices
  WHERE (NOT p_only_active) OR is_active = true;
  
  -- Buscar dispositivos com info de sessão ativa
  SELECT jsonb_agg(
    jsonb_build_object(
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
      -- Novo: verificar se tem sessão ativa para este dispositivo
      'has_active_session', EXISTS (
        SELECT 1 FROM public.active_sessions asess
        WHERE asess.user_id = ud.user_id
        AND asess.device_hash = ud.device_fingerprint
        AND asess.status = 'active'
        AND asess.expires_at > NOW()
      ),
      -- Contagem de dispositivos ativos do usuário
      'active_count', (
        SELECT COUNT(*) 
        FROM public.user_devices 
        WHERE user_id = ud.user_id AND is_active = true
      ),
      -- Verificar se usuário é owner (ilimitado)
      'is_owner', EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = ud.user_id AND ur.role = 'owner'
      )
    )
  ) INTO v_devices 
  FROM public.user_devices ud 
  LEFT JOIN auth.users au ON ud.user_id = au.id 
  WHERE (NOT p_only_active) OR ud.is_active = true
  ORDER BY ud.last_seen_at DESC NULLS LAST 
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'success', true, 
    'devices', COALESCE(v_devices, '[]'::jsonb), 
    'total', v_total
  );
END;
$$;

-- Atualizar admin_get_device_stats para refletir a realidade
CREATE OR REPLACE FUNCTION public.admin_get_device_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- Verificar permissão
  IF NOT public.check_is_owner_email(auth.uid()) THEN 
    RETURN '{"success":false,"error":"NOT_AUTHORIZED"}'::jsonb; 
  END IF;
  
  SELECT jsonb_build_object(
    -- Total de dispositivos registrados
    'total_devices', (SELECT COUNT(*) FROM public.user_devices WHERE is_active = true),
    -- Dispositivos registrados (não sessões)
    'active_devices', (SELECT COUNT(*) FROM public.user_devices WHERE is_active = true),
    -- Sessões ativas agora (somente 1 por usuário idealmente)
    'sessions_active', (
      SELECT COUNT(*) FROM public.active_sessions 
      WHERE status = 'active' AND expires_at > NOW()
    ),
    -- Total de usuários com dispositivos
    'total_users', (
      SELECT COUNT(DISTINCT user_id) FROM public.user_devices WHERE is_active = true
    ),
    -- Usuários no limite (3 dispositivos registrados, exceto owner)
    'users_at_limit', (
      SELECT COUNT(*) FROM (
        SELECT ud.user_id, COUNT(*) as cnt
        FROM public.user_devices ud
        LEFT JOIN public.user_roles ur ON ur.user_id = ud.user_id AND ur.role = 'owner'
        WHERE ud.is_active = true AND ur.id IS NULL
        GROUP BY ud.user_id
        HAVING COUNT(*) >= 3
      ) sub
    ),
    -- Tentativas bloqueadas nas últimas 24h
    'recent_attempts', (
      SELECT COUNT(*) FROM public.device_access_attempts 
      WHERE created_at > NOW() - INTERVAL '24 hours' AND blocked = true
    ),
    -- Dispositivos por tipo
    'devices_by_type', (
      SELECT jsonb_build_object(
        'desktop', COALESCE(SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END), 0),
        'mobile', COALESCE(SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END), 0),
        'tablet', COALESCE(SUM(CASE WHEN device_type = 'tablet' THEN 1 ELSE 0 END), 0)
      )
      FROM public.user_devices WHERE is_active = true
    ),
    -- Usuários online agora (com sessão ativa)
    'online_now', (
      SELECT COUNT(DISTINCT user_id) FROM public.active_sessions 
      WHERE status = 'active' 
      AND expires_at > NOW()
      AND last_activity_at > NOW() - INTERVAL '5 minutes'
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;