-- ============================================
-- PATCH: Feature Flags cortam execução REAL no server
-- Constituição SYNAPSE Ω v10.0
-- ============================================

-- Atualizar start_simulado_attempt para validar feature flags ANTES de criar tentativa
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
  v_user_id UUID := auth.uid();
  v_simulado RECORD;
  v_existing_attempt RECORD;
  v_new_attempt RECORD;
  v_attempt_number INTEGER;
  v_is_first_valid BOOLEAN;
  v_flag_simulados_enabled BOOLEAN;
  v_flag_new_attempts_blocked BOOLEAN;
  v_flag_hard_mode_enabled BOOLEAN;
BEGIN
  -- Validar autenticação
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- ========================================
  -- VALIDAR FEATURE FLAGS (EXECUÇÃO REAL)
  -- ========================================
  
  -- Flag global: sistema desativado
  SELECT COALESCE(flag_value, true) INTO v_flag_simulados_enabled
  FROM simulado_feature_flags WHERE flag_key = 'simulados_enabled';
  
  IF NOT COALESCE(v_flag_simulados_enabled, true) THEN
    RETURN json_build_object('success', false, 'error', 'SYSTEM_DISABLED', 'message', 'O sistema de simulados está temporariamente desativado.');
  END IF;
  
  -- Flag global: novas tentativas bloqueadas
  SELECT COALESCE(flag_value, false) INTO v_flag_new_attempts_blocked
  FROM simulado_feature_flags WHERE flag_key = 'new_attempts_blocked';
  
  IF COALESCE(v_flag_new_attempts_blocked, false) THEN
    RETURN json_build_object('success', false, 'error', 'NEW_ATTEMPTS_BLOCKED', 'message', 'Novas tentativas estão temporariamente bloqueadas para manutenção.');
  END IF;

  -- Buscar simulado
  SELECT * INTO v_simulado FROM public.simulados WHERE id = p_simulado_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_NOT_FOUND');
  END IF;

  -- Verificar mensagem de manutenção por simulado
  IF v_simulado.maintenance_message IS NOT NULL AND v_simulado.maintenance_message <> '' THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_MAINTENANCE', 'message', v_simulado.maintenance_message);
  END IF;

  -- Verificar janela de tempo
  IF v_simulado.starts_at IS NOT NULL AND now() < v_simulado.starts_at THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_NOT_STARTED', 'starts_at', v_simulado.starts_at);
  END IF;
  
  IF v_simulado.ends_at IS NOT NULL AND now() > v_simulado.ends_at THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_ENDED', 'ended_at', v_simulado.ends_at);
  END IF;

  -- Verificar tentativa RUNNING existente (idempotência) - PERMITE RETOMAR MESMO EM MANUTENÇÃO
  SELECT * INTO v_existing_attempt 
  FROM public.simulado_attempts 
  WHERE simulado_id = p_simulado_id AND user_id = v_user_id AND status = 'RUNNING';
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true, 
      'attempt_id', v_existing_attempt.id,
      'is_resumed', true,
      'started_at', v_existing_attempt.started_at,
      'attempt_number', v_existing_attempt.attempt_number
    );
  END IF;

  -- ========================================
  -- VALIDAR HARD MODE FLAGS (após buscar simulado)
  -- ========================================
  
  -- Flag global: Hard Mode desativado
  SELECT COALESCE(flag_value, true) INTO v_flag_hard_mode_enabled
  FROM simulado_feature_flags WHERE flag_key = 'hard_mode_enabled';
  
  -- Override por simulado: force_off, force_on, default
  -- Se hard_mode_override = 'force_off', desativa hard mode para este simulado
  -- Se hard_mode_override = 'force_on', ativa hard mode mesmo que flag global off
  -- Se hard_mode_override = 'default', usa flag global
  
  -- Nota: Não bloqueamos start, apenas ajustamos comportamento no resultado

  -- Calcular número da tentativa
  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_attempt_number
  FROM public.simulado_attempts
  WHERE simulado_id = p_simulado_id AND user_id = v_user_id;

  -- Verificar se é primeira tentativa válida (para ranking)
  SELECT NOT EXISTS (
    SELECT 1 FROM public.simulado_attempts
    WHERE simulado_id = p_simulado_id 
    AND user_id = v_user_id 
    AND status = 'FINISHED'
    AND is_scored_for_ranking = true
  ) INTO v_is_first_valid;

  -- Criar nova tentativa
  INSERT INTO public.simulado_attempts (
    simulado_id,
    user_id,
    status,
    attempt_number,
    is_scored_for_ranking,
    camera_active,
    ip_address,
    user_agent,
    device_fingerprint
  ) VALUES (
    p_simulado_id,
    v_user_id,
    'RUNNING',
    v_attempt_number,
    v_is_first_valid,
    v_simulado.requires_camera,
    p_ip_address::INET,
    p_user_agent,
    p_device_fingerprint
  )
  RETURNING * INTO v_new_attempt;

  -- Determinar is_hard_mode efetivo baseado em override
  DECLARE
    v_effective_hard_mode BOOLEAN;
  BEGIN
    IF v_simulado.hard_mode_override = 'force_off' THEN
      v_effective_hard_mode := false;
    ELSIF v_simulado.hard_mode_override = 'force_on' THEN
      v_effective_hard_mode := true;
    ELSE
      -- default: usa flag global + config do simulado
      v_effective_hard_mode := v_simulado.is_hard_mode AND COALESCE(v_flag_hard_mode_enabled, true);
    END IF;

    RETURN json_build_object(
      'success', true,
      'attempt_id', v_new_attempt.id,
      'is_resumed', false,
      'is_scored_for_ranking', v_new_attempt.is_scored_for_ranking,
      'started_at', v_new_attempt.started_at,
      'attempt_number', v_new_attempt.attempt_number,
      'duration_minutes', v_simulado.duration_minutes,
      'is_hard_mode', v_effective_hard_mode,
      'max_tab_switches', v_simulado.max_tab_switches,
      'requires_camera', v_simulado.requires_camera AND v_effective_hard_mode
    );
  END;
END;
$$;

-- ============================================
-- Adicionar tradução de erros no frontend
-- ============================================
COMMENT ON FUNCTION public.start_simulado_attempt IS 
'Inicia tentativa de simulado com validação de feature flags.
Erros possíveis:
- NOT_AUTHENTICATED: Usuário não logado
- SYSTEM_DISABLED: Sistema de simulados desativado (flag global)
- NEW_ATTEMPTS_BLOCKED: Novas tentativas bloqueadas (manutenção)
- SIMULADO_MAINTENANCE: Simulado específico em manutenção
- SIMULADO_NOT_FOUND: Simulado não existe ou inativo
- SIMULADO_NOT_STARTED: Fora da janela de início
- SIMULADO_ENDED: Fora da janela de término';