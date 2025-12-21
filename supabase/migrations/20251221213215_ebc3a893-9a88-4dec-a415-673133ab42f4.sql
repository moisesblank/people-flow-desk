-- ============================================
-- MATRIX v9.0 - PERFORMANCE MASSIVA 5000+ USUÁRIOS
-- Lei I: Velocidade da Luz (Corrigido)
-- ============================================

-- 1. ÍNDICES PARA PERFORMANCE MASSIVA
CREATE INDEX IF NOT EXISTS idx_profiles_online_activity 
ON public.profiles(is_online, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active_user 
ON public.user_sessions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_lessons_module_position 
ON public.lessons(module_id, position);

CREATE INDEX IF NOT EXISTS idx_lessons_area_position 
ON public.lessons(area_id, position);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson 
ON public.lesson_progress(user_id, lesson_id, completed);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz 
ON public.quiz_attempts(user_id, quiz_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_flashcards_user_due 
ON public.study_flashcards(user_id, due_date, state);

CREATE INDEX IF NOT EXISTS idx_xp_history_user_date 
ON public.xp_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transacoes_status_date 
ON public.transacoes_hotmart_completo(status, data_compra DESC);

-- 2. MATERIALIZED VIEW PARA DASHBOARD EXTREMO
DROP MATERIALIZED VIEW IF EXISTS public.mv_realtime_stats;
CREATE MATERIALIZED VIEW public.mv_realtime_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles WHERE is_online = true) as usuarios_online,
  (SELECT COUNT(*) FROM public.alunos WHERE status = 'ativo') as alunos_ativos,
  (SELECT COUNT(*) FROM public.employees WHERE status = 'ativo') as funcionarios_ativos,
  (SELECT COALESCE(SUM(valor), 0) FROM public.entradas WHERE created_at >= date_trunc('month', NOW())) as receita_mes,
  (SELECT COUNT(*) FROM public.transacoes_hotmart_completo WHERE status IN ('approved', 'purchase_approved') AND data_compra >= date_trunc('month', NOW())) as vendas_mes,
  NOW() as updated_at;

-- 3. FUNÇÃO PARA DASHBOARD CACHED
CREATE OR REPLACE FUNCTION public.get_dashboard_cached(p_force_refresh boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'usuarios_online', usuarios_online,
    'alunos_ativos', alunos_ativos,
    'funcionarios_ativos', funcionarios_ativos,
    'receita_mes', receita_mes,
    'vendas_mes', vendas_mes,
    'cached_at', updated_at
  ) INTO v_stats
  FROM public.mv_realtime_stats
  LIMIT 1;
  
  RETURN COALESCE(v_stats, '{}');
END;
$$;

-- 4. FUNÇÃO DE REFRESH
CREATE OR REPLACE FUNCTION public.refresh_realtime_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_realtime_stats;
END;
$$;

-- 5. CONNECTION POOL MONITORING
CREATE TABLE IF NOT EXISTS public.connection_pool_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_connections integer DEFAULT 0,
  peak_connections integer DEFAULT 0,
  requests_per_second numeric DEFAULT 0,
  measured_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.connection_pool_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only owner can view pool stats" ON public.connection_pool_stats;
CREATE POLICY "Only owner can view pool stats" 
ON public.connection_pool_stats 
FOR SELECT 
TO authenticated 
USING (public.is_owner(auth.uid()));

-- 6. FUNÇÃO PARA MONITORAR CARGA
CREATE OR REPLACE FUNCTION public.get_system_load()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_load jsonb;
BEGIN
  SELECT jsonb_build_object(
    'usuarios_online', (SELECT COUNT(*) FROM public.profiles WHERE is_online = true AND last_activity_at > NOW() - INTERVAL '5 minutes'),
    'sessoes_ativas', (SELECT COUNT(*) FROM public.user_sessions WHERE is_active = true),
    'video_streams', (SELECT COUNT(*) FROM public.lesson_progress WHERE updated_at > NOW() - INTERVAL '5 minutes'),
    'timestamp', NOW()
  ) INTO v_load;
  
  RETURN v_load;
END;
$$;

-- 7. ÍNDICES PARCIAIS OTIMIZADOS
CREATE INDEX IF NOT EXISTS idx_alunos_ativos ON public.alunos(email, nome) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_employees_ativos ON public.employees(user_id, nome) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_tasks_pending ON public.calendar_tasks(user_id, task_date) WHERE is_completed = false;

-- 8. CLEANUP AUTOMÁTICO PARA ALTA CARGA
CREATE OR REPLACE FUNCTION public.auto_cleanup_for_load()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE is_active = true AND last_activity_at < NOW() - INTERVAL '24 hours';
  
  DELETE FROM public.api_rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
  
  UPDATE public.profiles 
  SET is_online = false 
  WHERE is_online = true AND last_activity_at < NOW() - INTERVAL '10 minutes';
END;
$$;