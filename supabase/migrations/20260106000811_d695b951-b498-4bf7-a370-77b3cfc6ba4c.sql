
-- Corrigir finish_simulado_attempt para passar source_id corretamente como UUID
CREATE OR REPLACE FUNCTION public.finish_simulado_attempt(p_attempt_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
  v_simulado RECORD;
  v_stats RECORD;
  v_score INTEGER;
  v_xp_awarded INTEGER := 0;
BEGIN
  -- Validar autenticação
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Buscar tentativa
  SELECT * INTO v_attempt FROM public.simulado_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'ATTEMPT_NOT_FOUND');
  END IF;

  -- Verificar ownership
  IF v_attempt.user_id != v_user_id AND NOT public.is_admin_or_owner(v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  -- Idempotência: se já finalizado, retornar resultado existente
  IF v_attempt.status = 'FINISHED' THEN
    RETURN json_build_object(
      'success', true,
      'already_finished', true,
      'score', v_attempt.score,
      'correct_answers', v_attempt.correct_answers,
      'wrong_answers', v_attempt.wrong_answers
    );
  END IF;

  -- Não pode finalizar tentativa invalidada
  IF v_attempt.status = 'INVALIDATED' THEN
    RETURN json_build_object('success', false, 'error', 'ATTEMPT_INVALIDATED', 'reason', v_attempt.invalidation_reason);
  END IF;

  -- Buscar simulado
  SELECT * INTO v_simulado FROM public.simulados WHERE id = v_attempt.simulado_id;

  -- Calcular estatísticas
  SELECT 
    COUNT(*) FILTER (WHERE is_correct = true) as correct,
    COUNT(*) FILTER (WHERE is_correct = false) as wrong,
    COUNT(*) FILTER (WHERE selected_option IS NULL) as unanswered
  INTO v_stats
  FROM public.simulado_answers
  WHERE attempt_id = p_attempt_id;

  -- Calcular score
  v_score := COALESCE(v_stats.correct, 0) * v_simulado.points_per_question;

  -- Atualizar tentativa
  UPDATE public.simulado_attempts SET
    status = 'FINISHED',
    score = v_score,
    correct_answers = COALESCE(v_stats.correct, 0),
    wrong_answers = COALESCE(v_stats.wrong, 0),
    unanswered = COALESCE(v_stats.unanswered, 0),
    finished_at = now(),
    time_spent_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  WHERE id = p_attempt_id;

  -- Conceder XP apenas se for primeira tentativa válida
  IF v_attempt.is_scored_for_ranking = true THEN
    v_xp_awarded := v_score;
    -- CORRIGIDO: Passar simulado_id como source_id (UUID) e source como texto descritivo
    PERFORM public.add_user_xp(
      v_user_id, 
      v_xp_awarded, 
      'simulado',           -- source (TEXT)
      v_attempt.simulado_id, -- source_id (UUID) - CORRIGIDO!
      'Simulado finalizado' -- description
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'score', v_score,
    'correct_answers', COALESCE(v_stats.correct, 0),
    'wrong_answers', COALESCE(v_stats.wrong, 0),
    'unanswered', COALESCE(v_stats.unanswered, 0),
    'xp_awarded', v_xp_awarded,
    'is_scored_for_ranking', v_attempt.is_scored_for_ranking,
    'time_spent_seconds', EXTRACT(EPOCH FROM (now() - v_attempt.started_at))::INTEGER
  );
END;
$$;
