-- ============================================
-- 🛡️ CONSTITUIÇÃO SYNAPSE - LEI III SEGURANÇA
-- CORREÇÃO: Functions Search Path via ALTER
-- Não dropamos funções com dependências RLS
-- ============================================

-- ALTER para adicionar search_path às funções existentes
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.is_owner() SET search_path = public;
ALTER FUNCTION public.is_owner(uuid) SET search_path = public;

-- Funções que podem ser recriadas (sem dependências RLS)
CREATE OR REPLACE FUNCTION public.cleanup_old_sensitive_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.two_factor_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  DELETE FROM public.activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM public.analytics_metrics
  WHERE created_at < NOW() - INTERVAL '365 days';
  
  DELETE FROM public.user_sessions
  WHERE logout_at IS NOT NULL 
    AND logout_at < NOW() - INTERVAL '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.count_entity_attachments(p_entity_type text, p_entity_id text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.universal_attachments
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id
$$;

CREATE OR REPLACE FUNCTION public.get_entity_attachments(p_entity_type text, p_entity_id text)
RETURNS SETOF public.universal_attachments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.universal_attachments
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  ORDER BY created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.get_masked_location(p_latitude double precision, p_longitude double precision, p_address text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_owner(auth.uid()) THEN
    RETURN jsonb_build_object(
      'latitude', p_latitude,
      'longitude', p_longitude,
      'address', p_address
    );
  ELSE
    RETURN jsonb_build_object(
      'latitude', NULL,
      'longitude', NULL,
      'address', 'Localização registrada'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_location_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.time_clock_entries
  SET 
    latitude = NULL,
    longitude = NULL,
    location_address = 'Localização arquivada'
  WHERE registered_at < NOW() - INTERVAL '90 days'
    AND latitude IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_at_pos INTEGER;
  v_masked TEXT;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;
  v_at_pos := position('@' in p_email);
  IF v_at_pos <= 3 THEN
    v_masked := '***' || substring(p_email from v_at_pos);
  ELSE
    v_masked := substring(p_email from 1 for 2) || '***' || substring(p_email from v_at_pos);
  END IF;
  RETURN v_masked;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_phone IS NULL OR length(p_phone) < 4 THEN
    RETURN '***';
  END IF;
  RETURN '***' || substring(p_phone from length(p_phone) - 3);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_session_token(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.active_sessions
    WHERE session_token = p_session_token
      AND status = 'active'
      AND expires_at > NOW()
      AND user_id = auth.uid()
  ) INTO v_valid;
  
  IF v_valid THEN
    UPDATE public.active_sessions
    SET last_activity_at = NOW()
    WHERE session_token = p_session_token;
  END IF;
  
  RETURN v_valid;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role::text 
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'funcionario' THEN 3
      WHEN 'beta' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.check_device_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_limit integer := 3;
BEGIN
  IF public.is_owner(p_user_id) THEN
    RETURN jsonb_build_object('allowed', true, 'count', 0, 'limit', 999);
  END IF;
  
  SELECT COUNT(*) INTO v_count
  FROM public.active_sessions
  WHERE user_id = p_user_id AND status = 'active';
  
  RETURN jsonb_build_object(
    'allowed', v_count < v_limit,
    'count', v_count,
    'limit', v_limit
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_update_aluno_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (action, table_name, record_id, new_data)
  VALUES ('aluno_created', 'alunos', NEW.id::text, to_jsonb(NEW));
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_update_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET 
    total_vendas = COALESCE(total_vendas, 0) + 1,
    total_comissao = COALESCE(total_comissao, 0) + NEW.valor
  WHERE id = NEW.afiliado_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_metrica_diaria(p_data date, p_campo text, p_valor integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.metricas_diarias (data, data_referencia)
  VALUES (p_data, p_data)
  ON CONFLICT (data_referencia) DO NOTHING;

  EXECUTE format('UPDATE public.metricas_diarias SET %I = COALESCE(%I, 0) + $1 WHERE data_referencia = $2', p_campo, p_campo)
  USING p_valor, p_data;
END;
$$;