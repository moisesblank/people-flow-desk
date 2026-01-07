-- FIX: Corrigir start_simulado_attempt para usar is_active em vez de status
-- A tabela simulados usa is_active (boolean), não status (text)

CREATE OR REPLACE FUNCTION public.start_simulado_attempt(
  p_simulado_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_simulado RECORD;
  v_existing_attempt RECORD;
  v_new_attempt RECORD;
  v_attempt_number INTEGER;
  v_is_first_attempt BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Obter usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Buscar simulado
  SELECT * INTO v_simulado 
  FROM public.simulados 
  WHERE id = p_simulado_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_NOT_FOUND');
  END IF;

  -- Verificar se simulado está ativo (usando is_active, NÃO status)
  IF v_simulado.is_active != true THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_INACTIVE');
  END IF;

  -- Verificar janela de tempo (starts_at e ends_at)
  IF v_simulado.starts_at IS NOT NULL AND v_now < v_simulado.starts_at THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'SIMULADO_NOT_STARTED',
      'starts_at', v_simulado.starts_at
    );
  END IF;

  IF v_simulado.ends_at IS NOT NULL AND v_now > v_simulado.ends_at THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'SIMULADO_ENDED',
      'ended_at', v_simulado.ends_at
    );
  END IF;

  -- Feature flag: Verificar se simulado está em manutenção
  IF v_simulado.maintenance_message IS NOT NULL AND v_simulado.maintenance_message != '' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'SIMULADO_MAINTENANCE',
      'message', v_simulado.maintenance_message
    );
  END IF;

  -- Verificar tentativa existente EM ANDAMENTO
  SELECT * INTO v_existing_attempt
  FROM public.simulado_attempts
  WHERE simulado_id = p_simulado_id
    AND user_id = v_user_id
    AND status = 'RUNNING'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Retornar tentativa existente (resume)
    RETURN json_build_object(
      'success', true,
      'is_resumed', true,
      'attempt_id', v_existing_attempt.id,
      'is_scored_for_ranking', v_existing_attempt.is_scored_for_ranking,
      'started_at', v_existing_attempt.started_at,
      'attempt_number', v_existing_attempt.attempt_number,
      'duration_minutes', v_simulado.duration_minutes,
      'is_hard_mode', v_simulado.is_hard_mode,
      'max_tab_switches', v_simulado.max_tab_switches,
      'requires_camera', v_simulado.requires_camera
    );
  END IF;

  -- Contar tentativas anteriores do usuário
  SELECT COUNT(*) + 1 INTO v_attempt_number
  FROM public.simulado_attempts
  WHERE simulado_id = p_simulado_id
    AND user_id = v_user_id;

  -- Determinar se é primeira tentativa válida para ranking
  v_is_first_attempt := NOT EXISTS (
    SELECT 1 FROM public.simulado_attempts
    WHERE simulado_id = p_simulado_id
      AND user_id = v_user_id
      AND is_scored_for_ranking = true
  );

  -- Criar nova tentativa
  INSERT INTO public.simulado_attempts (
    simulado_id,
    user_id,
    status,
    attempt_number,
    is_scored_for_ranking,
    requires_camera,
    ip_address,
    user_agent,
    device_fingerprint,
    started_at
  ) VALUES (
    p_simulado_id,
    v_user_id,
    'RUNNING',
    v_attempt_number,
    v_is_first_attempt,
    v_simulado.requires_camera,
    CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::INET ELSE NULL END,
    p_user_agent,
    p_device_fingerprint,
    v_now
  )
  RETURNING * INTO v_new_attempt;

  -- Retornar dados da nova tentativa
  RETURN json_build_object(
    'success', true,
    'is_resumed', false,
    'attempt_id', v_new_attempt.id,
    'is_scored_for_ranking', v_is_first_attempt,
    'started_at', v_new_attempt.started_at,
    'attempt_number', v_attempt_number,
    'duration_minutes', v_simulado.duration_minutes,
    'is_hard_mode', v_simulado.is_hard_mode,
    'max_tab_switches', v_simulado.max_tab_switches,
    'requires_camera', v_simulado.requires_camera
  );
END;
$$;