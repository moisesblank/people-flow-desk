-- ============================================
-- ATUALIZAR grant_beta_access para usar user_roles.expires_at
-- user_access_expiration é DEPRECATED
-- ============================================

CREATE OR REPLACE FUNCTION public.grant_beta_access(_user_id uuid, _days integer DEFAULT 365)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_target_role app_role;
BEGIN
  -- Verificar se quem está chamando é owner ou admin
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'PERMISSION_DENIED');
  END IF;
  
  -- Calcular data de expiração
  v_end_date := NOW() + (_days || ' days')::INTERVAL;
  
  -- Determinar role: se _days < 3650, usa beta_expira; senão usa beta (permanente)
  IF _days < 3650 THEN
    v_target_role := 'beta_expira';
  ELSE
    v_target_role := 'beta';
  END IF;
  
  -- UPSERT em user_roles com expires_at
  INSERT INTO public.user_roles (user_id, role, expires_at)
  VALUES (
    _user_id, 
    v_target_role,
    CASE WHEN v_target_role = 'beta_expira' THEN v_end_date ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    expires_at = EXCLUDED.expires_at;
  
  -- Log de auditoria
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, metadata)
  VALUES (
    auth.uid(),
    'GRANT_BETA_ACCESS',
    'user_roles',
    _user_id::text,
    jsonb_build_object(
      'target_user_id', _user_id,
      'role', v_target_role,
      'expires_at', v_end_date,
      'days', _days
    ),
    jsonb_build_object(
      'caller_role', v_caller_role,
      'via_function', 'grant_beta_access'
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', _user_id,
    'role', v_target_role,
    'expires_at', v_end_date,
    'days_granted', _days
  );
END;
$$;

-- Atualizar extend_beta_access também
CREATE OR REPLACE FUNCTION public.extend_beta_access(_user_id uuid, _additional_days integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
  v_current_expires TIMESTAMP WITH TIME ZONE;
  v_new_expires TIMESTAMP WITH TIME ZONE;
  v_current_role app_role;
BEGIN
  -- Verificar permissão
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'PERMISSION_DENIED');
  END IF;
  
  -- Buscar role e expires_at atual
  SELECT role, expires_at INTO v_current_role, v_current_expires
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF v_current_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'USER_NOT_FOUND');
  END IF;
  
  -- Calcular nova data de expiração
  IF v_current_expires IS NOT NULL AND v_current_expires > NOW() THEN
    v_new_expires := v_current_expires + (_additional_days || ' days')::INTERVAL;
  ELSE
    v_new_expires := NOW() + (_additional_days || ' days')::INTERVAL;
  END IF;
  
  -- Atualizar expires_at
  UPDATE public.user_roles
  SET 
    role = 'beta_expira',
    expires_at = v_new_expires
  WHERE user_id = _user_id;
  
  -- Log de auditoria
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    'EXTEND_BETA_ACCESS',
    'user_roles',
    _user_id::text,
    jsonb_build_object('old_expires', v_current_expires, 'old_role', v_current_role),
    jsonb_build_object('new_expires', v_new_expires, 'additional_days', _additional_days)
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', _user_id,
    'new_expires_at', v_new_expires,
    'days_added', _additional_days
  );
END;
$$;

-- Atualizar revoke_beta_access
CREATE OR REPLACE FUNCTION public.revoke_beta_access(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role app_role;
  v_old_role app_role;
BEGIN
  -- Verificar permissão
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'PERMISSION_DENIED');
  END IF;
  
  -- Buscar role atual
  SELECT role INTO v_old_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Converter para aluno_gratuito
  UPDATE public.user_roles
  SET 
    role = 'aluno_gratuito',
    expires_at = NULL
  WHERE user_id = _user_id;
  
  -- Log de auditoria
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    'REVOKE_BETA_ACCESS',
    'user_roles',
    _user_id::text,
    jsonb_build_object('old_role', v_old_role),
    jsonb_build_object('new_role', 'aluno_gratuito')
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', _user_id,
    'new_role', 'aluno_gratuito'
  );
END;
$$;

-- Adicionar comentário de deprecation na tabela user_access_expiration
COMMENT ON TABLE public.user_access_expiration IS 
'DEPRECATED v10.x: Use user_roles.expires_at como fonte da verdade. Esta tabela será removida em versão futura.';