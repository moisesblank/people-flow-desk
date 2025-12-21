-- DOGMA XI: Funções de controle de dispositivos

-- Contar dispositivos
CREATE OR REPLACE FUNCTION public.count_user_devices(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.user_devices WHERE user_id = COALESCE(p_user_id, auth.uid()) AND is_active = true);
END;
$$;

-- Registrar dispositivo com limite
CREATE OR REPLACE FUNCTION public.register_device_with_limit(
  p_device_fingerprint TEXT, p_device_name TEXT, p_device_type TEXT DEFAULT 'desktop', p_browser TEXT DEFAULT NULL, p_os TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_owner BOOLEAN;
  v_device_count INTEGER;
  v_existing UUID;
  v_devices JSONB;
BEGIN
  IF v_user_id IS NULL THEN RETURN '{"success":false,"error":"NOT_AUTHENTICATED"}'::jsonb; END IF;
  v_is_owner := public.check_is_owner_email(v_user_id);
  
  SELECT id INTO v_existing FROM public.user_devices WHERE user_id = v_user_id AND device_fingerprint = p_device_fingerprint AND is_active = true;
  IF v_existing IS NOT NULL THEN
    UPDATE public.user_devices SET last_seen_at = NOW() WHERE id = v_existing;
    RETURN jsonb_build_object('success', true, 'device_id', v_existing, 'status', 'EXISTING_DEVICE', 'is_owner', v_is_owner);
  END IF;
  
  v_device_count := public.count_user_devices(v_user_id);
  IF NOT v_is_owner AND v_device_count >= 3 THEN
    SELECT jsonb_agg(jsonb_build_object('id', id, 'device_name', device_name, 'device_type', device_type, 'browser', browser, 'os', os, 'last_seen_at', last_seen_at) ORDER BY last_seen_at DESC) INTO v_devices FROM public.user_devices WHERE user_id = v_user_id AND is_active = true;
    RETURN jsonb_build_object('success', false, 'error', 'DEVICE_LIMIT_EXCEEDED', 'max_devices', 3, 'current_count', v_device_count, 'devices', COALESCE(v_devices, '[]'::jsonb));
  END IF;
  
  INSERT INTO public.user_devices (user_id, device_fingerprint, device_name, device_type, browser, os) VALUES (v_user_id, p_device_fingerprint, p_device_name, p_device_type, p_browser, p_os) ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET is_active = true, last_seen_at = NOW(), deactivated_at = NULL;
  RETURN jsonb_build_object('success', true, 'status', 'NEW_DEVICE_REGISTERED', 'device_count', v_device_count + 1, 'is_owner', v_is_owner);
END;
$$;

-- Desativar dispositivo
CREATE OR REPLACE FUNCTION public.deactivate_device(p_device_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_device_owner UUID;
  v_device_name TEXT;
  v_device_fp TEXT;
BEGIN
  SELECT user_id, device_name, device_fingerprint INTO v_device_owner, v_device_name, v_device_fp FROM public.user_devices WHERE id = p_device_id;
  IF v_device_owner IS NULL THEN RETURN '{"success":false,"error":"DEVICE_NOT_FOUND"}'::jsonb; END IF;
  IF NOT public.check_is_owner_email(v_user_id) AND v_device_owner != v_user_id THEN RETURN '{"success":false,"error":"NOT_AUTHORIZED"}'::jsonb; END IF;
  
  UPDATE public.user_devices SET is_active = false, deactivated_at = NOW(), deactivated_by = v_user_id WHERE id = p_device_id;
  UPDATE public.user_sessions SET is_active = false, logout_at = NOW() WHERE user_id = v_device_owner AND device_fingerprint = v_device_fp;
  RETURN jsonb_build_object('success', true, 'device_name', v_device_name);
END;
$$;

-- Listar dispositivos do usuário
CREATE OR REPLACE FUNCTION public.get_user_devices(p_user_id UUID DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID := COALESCE(p_user_id, auth.uid()); v_devices JSONB;
BEGIN
  IF NOT public.check_is_owner_email(auth.uid()) AND p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN RETURN '{"success":false,"error":"NOT_AUTHORIZED"}'::jsonb; END IF;
  SELECT jsonb_agg(jsonb_build_object('id', id, 'device_name', device_name, 'device_type', device_type, 'browser', browser, 'os', os, 'is_active', is_active, 'first_seen_at', first_seen_at, 'last_seen_at', last_seen_at) ORDER BY last_seen_at DESC NULLS LAST) INTO v_devices FROM public.user_devices WHERE user_id = v_user_id;
  RETURN jsonb_build_object('success', true, 'devices', COALESCE(v_devices, '[]'::jsonb), 'count', (SELECT COUNT(*) FROM public.user_devices WHERE user_id = v_user_id AND is_active = true));
END;
$$;

-- Admin: todos dispositivos
CREATE OR REPLACE FUNCTION public.admin_get_all_devices(p_limit INTEGER DEFAULT 100, p_offset INTEGER DEFAULT 0) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_devices JSONB; v_total INTEGER;
BEGIN
  IF NOT public.check_is_owner_email(auth.uid()) THEN RETURN '{"success":false,"error":"NOT_AUTHORIZED"}'::jsonb; END IF;
  SELECT COUNT(*) INTO v_total FROM public.user_devices;
  SELECT jsonb_agg(jsonb_build_object('id', ud.id, 'user_id', ud.user_id, 'user_email', au.email, 'device_name', ud.device_name, 'device_type', ud.device_type, 'browser', ud.browser, 'os', ud.os, 'is_active', ud.is_active, 'last_seen_at', ud.last_seen_at, 'active_count', (SELECT COUNT(*) FROM public.user_devices WHERE user_id = ud.user_id AND is_active = true))) INTO v_devices FROM public.user_devices ud LEFT JOIN auth.users au ON ud.user_id = au.id ORDER BY ud.last_seen_at DESC NULLS LAST LIMIT p_limit OFFSET p_offset;
  RETURN jsonb_build_object('success', true, 'devices', COALESCE(v_devices, '[]'::jsonb), 'total', v_total);
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_devices;