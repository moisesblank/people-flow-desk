-- FIX CRÍTICO: finish_simulado_attempt
-- O bug: is_correct está NULL porque não é calculado na inserção
-- A correção: calcular dinamicamente na finalização comparando selected_option com correct_answer

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
  v_correct_count INTEGER;
  v_wrong_count INTEGER;
  v_unanswered_count INTEGER;
  v_total_questions INTEGER;
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
      'wrong_answers', v_attempt.wrong_answers,
      'unanswered', v_attempt.unanswered,
      'xp_awarded', CASE WHEN v_attempt.is_scored_for_ranking THEN v_attempt.score ELSE 0 END,
      'is_scored_for_ranking', v_attempt.is_scored_for_ranking,
      'time_spent_seconds', v_attempt.time_spent_seconds
    );
  END IF;

  -- Não pode finalizar tentativa invalidada
  IF v_attempt.status = 'INVALIDATED' THEN
    RETURN json_build_object('success', false, 'error', 'ATTEMPT_INVALIDATED', 'reason', v_attempt.invalidation_reason);
  END IF;

  -- Buscar simulado
  SELECT * INTO v_simulado FROM public.simulados WHERE id = v_attempt.simulado_id;

  -- Contar total de questões do simulado
  SELECT COUNT(*) INTO v_total_questions
  FROM public.simulado_questions
  WHERE simulado_id = v_attempt.simulado_id;

  -- CORREÇÃO CRÍTICA: Calcular is_correct dinamicamente
  -- Primeiro, atualizar is_correct na tabela simulado_answers
  UPDATE public.simulado_answers sa
  SET is_correct = (
    -- Converter índice numérico (0,1,2,3,4) para letra (a,b,c,d,e) e comparar
    CASE 
      WHEN sa.selected_option IS NULL THEN NULL
      WHEN sa.selected_option ~ '^\d+$' THEN 
        -- É um índice numérico, converter para letra
        chr(97 + sa.selected_option::INTEGER) = LOWER(q.correct_answer)
      ELSE
        -- Já é uma letra, comparar diretamente
        LOWER(sa.selected_option) = LOWER(q.correct_answer)
    END
  )
  FROM public.quiz_questions q
  WHERE sa.question_id = q.id
    AND sa.attempt_id = p_attempt_id;

  -- Agora calcular estatísticas com is_correct atualizado
  SELECT 
    COUNT(*) FILTER (WHERE is_correct = true),
    COUNT(*) FILTER (WHERE is_correct = false),
    COUNT(*) FILTER (WHERE selected_option IS NULL)
  INTO v_correct_count, v_wrong_count, v_unanswered_count
  FROM public.simulado_answers
  WHERE attempt_id = p_attempt_id;

  -- Calcular unanswered: questões do simulado - respostas registradas
  -- Se uma questão não tem registro em simulado_answers, é unanswered
  SELECT v_total_questions - (v_correct_count + v_wrong_count + COALESCE(v_unanswered_count, 0))
  INTO v_unanswered_count;
  
  -- Garantir que não seja negativo
  v_unanswered_count := GREATEST(v_unanswered_count, 0);

  -- Calcular score
  v_score := COALESCE(v_correct_count, 0) * COALESCE(v_simulado.points_per_question, 10);

  -- Atualizar tentativa
  UPDATE public.simulado_attempts SET
    status = 'FINISHED',
    score = v_score,
    correct_answers = COALESCE(v_correct_count, 0),
    wrong_answers = COALESCE(v_wrong_count, 0),
    unanswered = COALESCE(v_unanswered_count, 0),
    finished_at = now(),
    time_spent_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  WHERE id = p_attempt_id;

  -- Conceder XP apenas se for primeira tentativa válida
  IF v_attempt.is_scored_for_ranking = true THEN
    v_xp_awarded := v_score;
    -- Passar simulado_id como source_id (UUID) e source como texto descritivo
    PERFORM public.add_user_xp(
      v_user_id, 
      v_xp_awarded, 
      'simulado',           -- source (TEXT)
      v_attempt.simulado_id, -- source_id (UUID)
      'Simulado finalizado' -- description
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'score', v_score,
    'correct_answers', COALESCE(v_correct_count, 0),
    'wrong_answers', COALESCE(v_wrong_count, 0),
    'unanswered', COALESCE(v_unanswered_count, 0),
    'xp_awarded', v_xp_awarded,
    'is_scored_for_ranking', v_attempt.is_scored_for_ranking,
    'time_spent_seconds', EXTRACT(EPOCH FROM (now() - v_attempt.started_at))::INTEGER
  );
END;
$$;