-- =====================================================
-- FASE 0: Dashboard de Análise por Áreas Beta
-- Performance Pre-Aggregation System
-- =====================================================

-- 1. Tabela para estatísticas globais pré-calculadas (atualizada diariamente)
CREATE TABLE IF NOT EXISTS public.performance_global_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro TEXT NOT NULL,
  micro TEXT,
  tema TEXT,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  accuracy_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_time_seconds NUMERIC(10,2),
  unique_users INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_performance_global_daily_macro ON public.performance_global_daily(macro);
CREATE INDEX IF NOT EXISTS idx_performance_global_daily_calculated ON public.performance_global_daily(calculated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_global_daily_unique ON public.performance_global_daily(macro, COALESCE(micro, ''), COALESCE(tema, ''));

-- RLS para leitura pública (dados agregados, não sensíveis)
ALTER TABLE public.performance_global_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read global stats"
ON public.performance_global_daily FOR SELECT
TO authenticated
USING (true);

-- 2. Função RPC: get_student_taxonomy_performance
-- Retorna performance do aluno agrupada por taxonomia (360 dias, max 5000)
CREATE OR REPLACE FUNCTION public.get_student_taxonomy_performance(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 360
)
RETURNS TABLE (
  macro TEXT,
  micro TEXT,
  tema TEXT,
  subtema TEXT,
  total_attempts BIGINT,
  correct_attempts BIGINT,
  accuracy_percent NUMERIC,
  avg_time_seconds NUMERIC,
  difficulty_distribution JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(q.macro, 'Sem Macro') AS macro,
    COALESCE(q.micro, 'Sem Micro') AS micro,
    COALESCE(q.tema, 'Sem Tema') AS tema,
    COALESCE(q.subtema, 'Sem Subtema') AS subtema,
    COUNT(*)::BIGINT AS total_attempts,
    SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::BIGINT AS correct_attempts,
    ROUND(
      (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) AS accuracy_percent,
    ROUND(AVG(qa.time_spent_seconds)::NUMERIC, 2) AS avg_time_seconds,
    jsonb_build_object(
      'facil', SUM(CASE WHEN q.difficulty = 'facil' THEN 1 ELSE 0 END),
      'medio', SUM(CASE WHEN q.difficulty = 'medio' THEN 1 ELSE 0 END),
      'dificil', SUM(CASE WHEN q.difficulty = 'dificil' THEN 1 ELSE 0 END)
    ) AS difficulty_distribution
  FROM public.question_attempts qa
  INNER JOIN public.quiz_questions q ON q.id = qa.question_id
  WHERE qa.user_id = p_user_id
    AND qa.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY 
    COALESCE(q.macro, 'Sem Macro'),
    COALESCE(q.micro, 'Sem Micro'),
    COALESCE(q.tema, 'Sem Tema'),
    COALESCE(q.subtema, 'Sem Subtema')
  ORDER BY total_attempts DESC
  LIMIT 5000;
END;
$$;

-- 3. Função RPC: get_student_performance_stats
-- Retorna estatísticas resumidas para os 4 cards principais
CREATE OR REPLACE FUNCTION public.get_student_performance_stats(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 360
)
RETURNS TABLE (
  total_questions BIGINT,
  total_correct BIGINT,
  overall_accuracy NUMERIC,
  avg_time_seconds NUMERIC,
  best_macro TEXT,
  best_macro_accuracy NUMERIC,
  worst_macro TEXT,
  worst_macro_accuracy NUMERIC,
  total_xp BIGINT,
  current_streak INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_best_macro RECORD;
  v_worst_macro RECORD;
  v_gamification RECORD;
BEGIN
  -- Buscar melhor macro (mínimo 5 tentativas para relevância)
  SELECT 
    COALESCE(q.macro, 'Sem Macro') AS macro_name,
    ROUND((SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS accuracy
  INTO v_best_macro
  FROM public.question_attempts qa
  INNER JOIN public.quiz_questions q ON q.id = qa.question_id
  WHERE qa.user_id = p_user_id
    AND qa.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY COALESCE(q.macro, 'Sem Macro')
  HAVING COUNT(*) >= 5
  ORDER BY accuracy DESC
  LIMIT 1;

  -- Buscar pior macro (mínimo 5 tentativas)
  SELECT 
    COALESCE(q.macro, 'Sem Macro') AS macro_name,
    ROUND((SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS accuracy
  INTO v_worst_macro
  FROM public.question_attempts qa
  INNER JOIN public.quiz_questions q ON q.id = qa.question_id
  WHERE qa.user_id = p_user_id
    AND qa.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY COALESCE(q.macro, 'Sem Macro')
  HAVING COUNT(*) >= 5
  ORDER BY accuracy ASC
  LIMIT 1;

  -- Buscar dados de gamificação
  SELECT ug.total_xp, ug.current_streak
  INTO v_gamification
  FROM public.user_gamification ug
  WHERE ug.user_id = p_user_id;

  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_questions,
    SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::BIGINT AS total_correct,
    ROUND(
      (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) AS overall_accuracy,
    ROUND(AVG(qa.time_spent_seconds)::NUMERIC, 2) AS avg_time_seconds,
    COALESCE(v_best_macro.macro_name, 'N/A') AS best_macro,
    COALESCE(v_best_macro.accuracy, 0) AS best_macro_accuracy,
    COALESCE(v_worst_macro.macro_name, 'N/A') AS worst_macro,
    COALESCE(v_worst_macro.accuracy, 0) AS worst_macro_accuracy,
    COALESCE(v_gamification.total_xp, 0)::BIGINT AS total_xp,
    COALESCE(v_gamification.current_streak, 0) AS current_streak
  FROM public.question_attempts qa
  WHERE qa.user_id = p_user_id
    AND qa.created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$;

-- 4. Função RPC: get_student_trends
-- Calcula tendências por macro (últimos 14 dias vs anteriores)
-- Só retorna se tiver base estatística (≥30 total OU ≥15 por período)
CREATE OR REPLACE FUNCTION public.get_student_trends(
  p_user_id UUID,
  p_period_days INTEGER DEFAULT 14
)
RETURNS TABLE (
  macro TEXT,
  recent_accuracy NUMERIC,
  previous_accuracy NUMERIC,
  trend TEXT,
  recent_attempts BIGINT,
  previous_attempts BIGINT,
  is_statistically_valid BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH recent_data AS (
    SELECT 
      COALESCE(q.macro, 'Sem Macro') AS macro_name,
      COUNT(*) AS attempts,
      ROUND((SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS accuracy
    FROM public.question_attempts qa
    INNER JOIN public.quiz_questions q ON q.id = qa.question_id
    WHERE qa.user_id = p_user_id
      AND qa.created_at >= NOW() - (p_period_days || ' days')::INTERVAL
    GROUP BY COALESCE(q.macro, 'Sem Macro')
  ),
  previous_data AS (
    SELECT 
      COALESCE(q.macro, 'Sem Macro') AS macro_name,
      COUNT(*) AS attempts,
      ROUND((SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS accuracy
    FROM public.question_attempts qa
    INNER JOIN public.quiz_questions q ON q.id = qa.question_id
    WHERE qa.user_id = p_user_id
      AND qa.created_at >= NOW() - (p_period_days * 2 || ' days')::INTERVAL
      AND qa.created_at < NOW() - (p_period_days || ' days')::INTERVAL
    GROUP BY COALESCE(q.macro, 'Sem Macro')
  )
  SELECT 
    COALESCE(r.macro_name, p.macro_name) AS macro,
    COALESCE(r.accuracy, 0) AS recent_accuracy,
    COALESCE(p.accuracy, 0) AS previous_accuracy,
    CASE 
      WHEN r.accuracy IS NULL OR p.accuracy IS NULL THEN 'insufficient_data'
      WHEN r.accuracy > p.accuracy + 5 THEN 'up'
      WHEN r.accuracy < p.accuracy - 5 THEN 'down'
      ELSE 'stable'
    END AS trend,
    COALESCE(r.attempts, 0)::BIGINT AS recent_attempts,
    COALESCE(p.attempts, 0)::BIGINT AS previous_attempts,
    -- Válido se: total ≥30 OU cada período ≥15
    (COALESCE(r.attempts, 0) + COALESCE(p.attempts, 0) >= 30 
     OR (COALESCE(r.attempts, 0) >= 15 AND COALESCE(p.attempts, 0) >= 15)) AS is_statistically_valid
  FROM recent_data r
  FULL OUTER JOIN previous_data p ON r.macro_name = p.macro_name
  ORDER BY COALESCE(r.attempts, 0) + COALESCE(p.attempts, 0) DESC;
END;
$$;

-- 5. Função para atualizar estatísticas globais (chamada via cron diário)
CREATE OR REPLACE FUNCTION public.refresh_global_performance_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Limpar dados antigos (manter apenas última execução)
  DELETE FROM public.performance_global_daily 
  WHERE calculated_at < NOW() - INTERVAL '2 days';

  -- Inserir dados agregados globais
  INSERT INTO public.performance_global_daily (
    macro, micro, tema, total_attempts, correct_attempts, 
    accuracy_percent, avg_time_seconds, unique_users, calculated_at
  )
  SELECT 
    COALESCE(q.macro, 'Sem Macro') AS macro,
    COALESCE(q.micro, 'Sem Micro') AS micro,
    COALESCE(q.tema, 'Sem Tema') AS tema,
    COUNT(*) AS total_attempts,
    SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
    ROUND(
      (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) AS accuracy_percent,
    ROUND(AVG(qa.time_spent_seconds)::NUMERIC, 2) AS avg_time_seconds,
    COUNT(DISTINCT qa.user_id) AS unique_users,
    NOW() AS calculated_at
  FROM public.question_attempts qa
  INNER JOIN public.quiz_questions q ON q.id = qa.question_id
  WHERE qa.created_at >= NOW() - INTERVAL '360 days'
  GROUP BY 
    COALESCE(q.macro, 'Sem Macro'),
    COALESCE(q.micro, 'Sem Micro'),
    COALESCE(q.tema, 'Sem Tema')
  ON CONFLICT (macro, COALESCE(micro, ''), COALESCE(tema, ''))
  DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    correct_attempts = EXCLUDED.correct_attempts,
    accuracy_percent = EXCLUDED.accuracy_percent,
    avg_time_seconds = EXCLUDED.avg_time_seconds,
    unique_users = EXCLUDED.unique_users,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = NOW();

  -- Log da execução
  INSERT INTO public.audit_logs (action, table_name, metadata)
  VALUES (
    'REFRESH_GLOBAL_STATS',
    'performance_global_daily',
    jsonb_build_object('executed_at', NOW(), 'type', 'daily_refresh')
  );
END;
$$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_performance_global_daily_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_performance_global_daily_updated_at ON public.performance_global_daily;
CREATE TRIGGER trg_performance_global_daily_updated_at
  BEFORE UPDATE ON public.performance_global_daily
  FOR EACH ROW
  EXECUTE FUNCTION public.update_performance_global_daily_updated_at();