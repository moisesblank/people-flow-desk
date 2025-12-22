-- ============================================
-- 🛡️ Ω1: GATEKEEPER SOBERANO — FUNÇÕES CANÔNICAS (CORRIGIDO)
-- Usando apenas roles válidas do ENUM app_role
-- ============================================

-- 3. is_funcionario_or_owner() - Funcionário ou owner (CORRIGIDO)
CREATE OR REPLACE FUNCTION public.is_funcionario_or_owner(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner(_user_id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'employee', 'suporte', 'coordenacao', 'monitoria', 'marketing', 'contabilidade', 'afiliado')
  );
$$;

-- 6. assert_role() - Levanta exceção se não tiver a role
CREATE OR REPLACE FUNCTION public.assert_role(_user_id UUID, _required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _required_role = 'owner' AND NOT public.is_owner(_user_id) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Owner role required' USING ERRCODE = '42501';
  END IF;
  
  IF _required_role = 'admin' AND NOT public.is_admin_or_owner(_user_id) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin role required' USING ERRCODE = '42501';
  END IF;
  
  IF _required_role = 'employee' AND NOT public.is_funcionario_or_owner(_user_id) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Employee role required' USING ERRCODE = '42501';
  END IF;
  
  IF _required_role = 'beta' AND NOT public.is_beta_or_owner(_user_id) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Beta role required' USING ERRCODE = '42501';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 7. log_access_attempt() - Log de tentativas de acesso (segurança)
CREATE OR REPLACE FUNCTION public.log_access_attempt(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_allowed BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    payload,
    created_at
  ) VALUES (
    CASE WHEN p_allowed THEN 'access_granted' ELSE 'access_denied' END,
    CASE WHEN p_allowed THEN 'info' ELSE 'warning' END,
    p_user_id,
    jsonb_build_object(
      'action', p_action,
      'resource', p_resource,
      'allowed', p_allowed,
      'reason', p_reason
    ),
    now()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 8. can_access_resource() - Verifica acesso a um recurso específico
CREATE OR REPLACE FUNCTION public.can_access_resource(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_allowed BOOLEAN := FALSE;
BEGIN
  -- Owner pode tudo
  IF public.is_owner(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  v_role := public.get_user_role(p_user_id);
  
  -- Verificar por tipo de recurso
  CASE p_resource_type
    WHEN 'gestao' THEN
      v_allowed := public.is_funcionario_or_owner(p_user_id);
    WHEN 'alunos' THEN
      v_allowed := public.is_beta_or_owner(p_user_id);
    WHEN 'comunidade' THEN
      v_allowed := TRUE; -- Qualquer autenticado
    WHEN 'owner_only' THEN
      v_allowed := public.is_owner(p_user_id);
    ELSE
      v_allowed := TRUE; -- Público por padrão
  END CASE;
  
  RETURN v_allowed;
END;
$$;