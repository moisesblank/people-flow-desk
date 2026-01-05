-- Atualizar função start_simulado_attempt para reiniciar o cronômetro quando o simulado for reaberto
-- Constituição SYNAPSE Ω v10.0 - Timer Reset on Resume

CREATE OR REPLACE FUNCTION public.start_simulado_attempt(
  p_simulado_id uuid,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_simulado record;
  v_existing_attempt record;
  v_new_attempt record;
  v_attempt_number integer;
  v_is_first_attempt boolean;
  v_now timestamptz := now();
BEGIN
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Buscar simulado com feature flags
  SELECT * INTO v_simulado 
  FROM public.simulados 
  WHERE id = p_simulado_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_NOT_FOUND');
  END IF;

  -- Verificar status do simulado
  IF v_simulado.status != 'ativo' THEN
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
  IF v_simulado.is_maintenance = true THEN
    -- Se simulado_config.allow_resume_in_maintenance = true, permite retomar tentativas existentes
    -- Caso contrário, bloqueia completamente
    SELECT * INTO v_existing_attempt 
    FROM public.simulado_attempts 
    WHERE simulado_id = p_simulado_id AND user_id = v_user_id AND status = 'RUNNING';
    
    IF FOUND THEN
      -- NOVA LÓGICA: Reiniciar o cronômetro ao retomar
      UPDATE public.simulado_attempts 
      SET started_at = v_now,
          updated_at = v_now
      WHERE id = v_existing_attempt.id;
      
      RETURN json_build_object(
        'success', true, 
        'attempt_id', v_existing_attempt.id,
        'is_resumed', true,
        'started_at', v_now, -- Retorna o novo started_at
        'attempt_number', v_existing_attempt.attempt_number
      );
    END IF;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'SIMULADO_MAINTENANCE',
      'message', COALESCE(v_simulado.maintenance_message, 'Simulado em manutenção. Tente novamente mais tarde.')
    );
  END IF;

  -- Verificar tentativa RUNNING existente (idempotência)
  SELECT * INTO v_existing_attempt 
  FROM public.simulado_attempts 
  WHERE simulado_id = p_simulado_id AND user_id = v_user_id AND status = 'RUNNING';
  
  IF FOUND THEN
    -- NOVA LÓGICA: Reiniciar o cronômetro ao retomar
    UPDATE public.simulado_attempts 
    SET started_at = v_now,
        updated_at = v_now
    WHERE id = v_existing_attempt.id;
    
    RETURN json_build_object(
      'success', true, 
      'attempt_id', v_existing_attempt.id,
      'is_resumed', true,
      'started_at', v_now, -- Retorna o novo started_at
      'attempt_number', v_existing_attempt.attempt_number
    );
  END IF;

  -- Verificar se há tentativa já finalizada (para determinar se pontua para ranking)
  SELECT COUNT(*) INTO v_attempt_number
  FROM public.simulado_attempts
  WHERE simulado_id = p_simulado_id AND user_id = v_user_id;

  v_is_first_attempt := (v_attempt_number = 0);
  v_attempt_number := v_attempt_number + 1;

  -- Criar nova tentativa
  INSERT INTO public.simulado_attempts (
    simulado_id,
    user_id,
    status,
    started_at,
    attempt_number,
    is_scored_for_ranking,
    ip_address,
    user_agent,
    device_fingerprint
  ) VALUES (
    p_simulado_id,
    v_user_id,
    'RUNNING',
    v_now,
    v_attempt_number,
    v_is_first_attempt,
    p_ip_address,
    p_user_agent,
    p_device_fingerprint
  )
  RETURNING * INTO v_new_attempt;

  RETURN json_build_object(
    'success', true,
    'attempt_id', v_new_attempt.id,
    'is_resumed', false,
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