-- ============================================================
-- 🎯 SIMULADOS + MODO HARD — FASE 1: MIGRATION COMPLETA
-- Versão: 1.0.0 | Data: 2026-01-04
-- Constituição: SYNAPSE Ω v10.0 | PATCH-ONLY | ADITIVO
-- ============================================================

-- ============================================================
-- BLOCO 1: TABELA PRINCIPAL — simulados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.simulados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadados básicos
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  
  -- Configurações de tempo
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  results_released_at TIMESTAMPTZ,
  
  -- Modo Hard
  is_hard_mode BOOLEAN NOT NULL DEFAULT false,
  max_tab_switches INTEGER DEFAULT 3,
  requires_camera BOOLEAN DEFAULT false,
  
  -- Configurações gerais
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_correct_answer_after BOOLEAN DEFAULT true,
  
  -- Questões (array de IDs ou relação)
  question_ids UUID[] DEFAULT '{}',
  total_questions INTEGER GENERATED ALWAYS AS (array_length(question_ids, 1)) STORED,
  
  -- Pontuação
  points_per_question INTEGER NOT NULL DEFAULT 10,
  passing_score INTEGER DEFAULT 60,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simulados_starts_at ON public.simulados(starts_at);
CREATE INDEX IF NOT EXISTS idx_simulados_ends_at ON public.simulados(ends_at);
CREATE INDEX IF NOT EXISTS idx_simulados_is_active ON public.simulados(is_active);
CREATE INDEX IF NOT EXISTS idx_simulados_slug ON public.simulados(slug);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_simulados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_simulados_updated_at ON public.simulados;
CREATE TRIGGER tr_simulados_updated_at
  BEFORE UPDATE ON public.simulados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_simulados_updated_at();

-- RLS
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "simulados_select_authenticated" ON public.simulados
  FOR SELECT TO authenticated
  USING (is_published = true OR created_by = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "simulados_insert_admin" ON public.simulados
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "simulados_update_admin" ON public.simulados
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "simulados_delete_owner" ON public.simulados
  FOR DELETE TO authenticated
  USING (public.is_owner(auth.uid()));

-- ============================================================
-- BLOCO 2: TABELA — simulado_attempts (tentativas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.simulado_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status da tentativa
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'FINISHED', 'ABANDONED', 'INVALIDATED')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  
  -- Pontuação (apenas primeira tentativa válida)
  is_scored_for_ranking BOOLEAN NOT NULL DEFAULT false,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  unanswered INTEGER DEFAULT 0,
  
  -- Modo Hard - Violações
  tab_switches INTEGER DEFAULT 0,
  invalidation_reason TEXT,
  camera_active BOOLEAN DEFAULT false,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  
  -- Auditoria
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraint: apenas uma tentativa RUNNING por usuário/simulado
CREATE UNIQUE INDEX IF NOT EXISTS idx_simulado_attempts_running_unique 
  ON public.simulado_attempts(simulado_id, user_id) 
  WHERE status = 'RUNNING';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_user ON public.simulado_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_simulado ON public.simulado_attempts(simulado_id);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_status ON public.simulado_attempts(status);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_ranking ON public.simulado_attempts(simulado_id, is_scored_for_ranking, score DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS tr_simulado_attempts_updated_at ON public.simulado_attempts;
CREATE TRIGGER tr_simulado_attempts_updated_at
  BEFORE UPDATE ON public.simulado_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_simulados_updated_at();

-- RLS
ALTER TABLE public.simulado_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "attempts_select_own" ON public.simulado_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "attempts_insert_own" ON public.simulado_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "attempts_update_own" ON public.simulado_attempts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

-- ============================================================
-- BLOCO 3: TABELA — simulado_answers (respostas por tentativa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.simulado_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  attempt_id UUID NOT NULL REFERENCES public.simulado_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  
  -- Resposta
  selected_option TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT now(),
  time_spent_seconds INTEGER,
  
  -- Ordem no simulado
  question_order INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: uma resposta por questão por tentativa
  CONSTRAINT simulado_answers_unique UNIQUE (attempt_id, question_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_simulado_answers_attempt ON public.simulado_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_simulado_answers_question ON public.simulado_answers(question_id);

-- RLS
ALTER TABLE public.simulado_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (herda do attempt)
CREATE POLICY "answers_select_own" ON public.simulado_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.simulado_attempts a 
      WHERE a.id = attempt_id 
      AND (a.user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()))
    )
  );

CREATE POLICY "answers_insert_own" ON public.simulado_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.simulado_attempts a 
      WHERE a.id = attempt_id 
      AND a.user_id = auth.uid()
      AND a.status = 'RUNNING'
    )
  );

CREATE POLICY "answers_update_own" ON public.simulado_answers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.simulado_attempts a 
      WHERE a.id = attempt_id 
      AND a.user_id = auth.uid()
      AND a.status = 'RUNNING'
    )
  );

-- ============================================================
-- BLOCO 4: RPCs — SECURITY DEFINER
-- ============================================================

-- RPC 1: start_simulado_attempt
-- Inicia ou retorna tentativa existente (idempotente)
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
BEGIN
  -- Validar autenticação
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Buscar simulado
  SELECT * INTO v_simulado FROM public.simulados WHERE id = p_simulado_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_NOT_FOUND');
  END IF;

  -- Verificar janela de tempo
  IF v_simulado.starts_at IS NOT NULL AND now() < v_simulado.starts_at THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_NOT_STARTED', 'starts_at', v_simulado.starts_at);
  END IF;
  
  IF v_simulado.ends_at IS NOT NULL AND now() > v_simulado.ends_at THEN
    RETURN json_build_object('success', false, 'error', 'SIMULADO_ENDED', 'ended_at', v_simulado.ends_at);
  END IF;

  -- Verificar tentativa RUNNING existente (idempotência)
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

  RETURN json_build_object(
    'success', true,
    'attempt_id', v_new_attempt.id,
    'is_resumed', false,
    'is_scored_for_ranking', v_new_attempt.is_scored_for_ranking,
    'started_at', v_new_attempt.started_at,
    'attempt_number', v_new_attempt.attempt_number,
    'duration_minutes', v_simulado.duration_minutes,
    'is_hard_mode', v_simulado.is_hard_mode,
    'max_tab_switches', v_simulado.max_tab_switches,
    'requires_camera', v_simulado.requires_camera
  );
END;
$$;

-- RPC 2: finish_simulado_attempt
-- Finaliza tentativa e calcula pontuação (idempotente)
CREATE OR REPLACE FUNCTION public.finish_simulado_attempt(
  p_attempt_id UUID
)
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
    PERFORM public.add_user_xp(v_user_id, v_xp_awarded, 'simulado_' || v_attempt.simulado_id::TEXT);
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

-- RPC 3: increment_tab_switch
-- Registra troca de aba (Modo Hard)
CREATE OR REPLACE FUNCTION public.increment_tab_switch(
  p_attempt_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
  v_simulado RECORD;
  v_new_count INTEGER;
BEGIN
  -- Validar autenticação
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Buscar tentativa
  SELECT * INTO v_attempt FROM public.simulado_attempts WHERE id = p_attempt_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'ATTEMPT_NOT_FOUND');
  END IF;

  -- Só incrementa se RUNNING
  IF v_attempt.status != 'RUNNING' THEN
    RETURN json_build_object('success', false, 'error', 'ATTEMPT_NOT_RUNNING');
  END IF;

  -- Buscar simulado
  SELECT * INTO v_simulado FROM public.simulados WHERE id = v_attempt.simulado_id;

  -- Incrementar contador
  v_new_count := COALESCE(v_attempt.tab_switches, 0) + 1;
  
  UPDATE public.simulado_attempts 
  SET tab_switches = v_new_count
  WHERE id = p_attempt_id;

  -- Verificar se excedeu limite (Modo Hard)
  IF v_simulado.is_hard_mode AND v_simulado.max_tab_switches IS NOT NULL AND v_new_count > v_simulado.max_tab_switches THEN
    -- Auto-invalidar
    UPDATE public.simulado_attempts SET
      status = 'INVALIDATED',
      invalidation_reason = 'TAB_SWITCH_LIMIT_EXCEEDED',
      finished_at = now()
    WHERE id = p_attempt_id;

    RETURN json_build_object(
      'success', true,
      'tab_switches', v_new_count,
      'invalidated', true,
      'reason', 'TAB_SWITCH_LIMIT_EXCEEDED'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'tab_switches', v_new_count,
    'max_allowed', v_simulado.max_tab_switches,
    'invalidated', false
  );
END;
$$;

-- RPC 4: invalidate_simulado_attempt
-- Invalida tentativa manualmente (admin ou sistema)
CREATE OR REPLACE FUNCTION public.invalidate_simulado_attempt(
  p_attempt_id UUID,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt RECORD;
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

  -- Apenas owner da tentativa ou admin pode invalidar
  IF v_attempt.user_id != v_user_id AND NOT public.is_admin_or_owner(v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  -- Não pode invalidar tentativa já finalizada ou invalidada
  IF v_attempt.status IN ('FINISHED', 'INVALIDATED') THEN
    RETURN json_build_object('success', false, 'error', 'ATTEMPT_ALREADY_TERMINAL', 'status', v_attempt.status);
  END IF;

  -- Invalidar
  UPDATE public.simulado_attempts SET
    status = 'INVALIDATED',
    invalidation_reason = p_reason,
    finished_at = now(),
    is_scored_for_ranking = false
  WHERE id = p_attempt_id;

  RETURN json_build_object(
    'success', true,
    'invalidated', true,
    'reason', p_reason
  );
END;
$$;

-- RPC 5: get_simulado_ranking
-- Retorna ranking do simulado
CREATE OR REPLACE FUNCTION public.get_simulado_ranking(
  p_simulado_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(ranked ORDER BY rank_position) INTO v_result
  FROM (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY a.score DESC, a.time_spent_seconds ASC) as rank_position,
      a.user_id,
      p.nome as user_name,
      p.avatar_url,
      a.score,
      a.correct_answers,
      a.wrong_answers,
      a.time_spent_seconds,
      a.finished_at
    FROM public.simulado_attempts a
    JOIN public.profiles p ON p.id = a.user_id
    WHERE a.simulado_id = p_simulado_id
    AND a.status = 'FINISHED'
    AND a.is_scored_for_ranking = true
    ORDER BY a.score DESC, a.time_spent_seconds ASC
    LIMIT p_limit
  ) ranked;

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- RPC 6: get_question_error_rate (para estatísticas)
CREATE OR REPLACE FUNCTION public.get_question_error_rate(
  p_simulado_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Apenas admin pode ver estatísticas
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  SELECT json_agg(stats) INTO v_result
  FROM (
    SELECT 
      sa.question_id,
      q.question_text,
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE sa.is_correct = true) as correct_count,
      COUNT(*) FILTER (WHERE sa.is_correct = false) as wrong_count,
      ROUND(
        (COUNT(*) FILTER (WHERE sa.is_correct = false)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) as error_rate_percent
    FROM public.simulado_answers sa
    JOIN public.simulado_attempts a ON a.id = sa.attempt_id
    JOIN public.quiz_questions q ON q.id = sa.question_id
    WHERE a.simulado_id = p_simulado_id
    AND a.status = 'FINISHED'
    GROUP BY sa.question_id, q.question_text
    ORDER BY error_rate_percent DESC
  ) stats;

  RETURN json_build_object('success', true, 'data', COALESCE(v_result, '[]'::JSON));
END;
$$;

-- ============================================================
-- BLOCO 5: GRANT PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.start_simulado_attempt(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_simulado_attempt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tab_switch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_simulado_attempt(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simulado_ranking(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_error_rate(UUID) TO authenticated;

-- ============================================================
-- ROLLBACK DOCUMENTATION
-- ============================================================
-- Para reverter esta migration:
--
-- DROP FUNCTION IF EXISTS public.get_question_error_rate(UUID);
-- DROP FUNCTION IF EXISTS public.get_simulado_ranking(UUID, INTEGER);
-- DROP FUNCTION IF EXISTS public.invalidate_simulado_attempt(UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.increment_tab_switch(UUID);
-- DROP FUNCTION IF EXISTS public.finish_simulado_attempt(UUID);
-- DROP FUNCTION IF EXISTS public.start_simulado_attempt(UUID, TEXT, TEXT, TEXT);
-- DROP TABLE IF EXISTS public.simulado_answers;
-- DROP TABLE IF EXISTS public.simulado_attempts;
-- DROP TABLE IF EXISTS public.simulados;
-- DROP FUNCTION IF EXISTS public.update_simulados_updated_at();
-- ============================================================