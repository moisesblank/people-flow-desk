-- ============================================================
-- SNA OMEGA v5.0 - PARTE FINAL
-- Cleanup, RLS, Dados Iniciais, Realtime
-- ============================================================

-- 4.12 Cleanup automático
CREATE OR REPLACE FUNCTION public.sna_cleanup(
  p_job_retention_days INT DEFAULT 30,
  p_tool_run_retention_days INT DEFAULT 7,
  p_cache_cleanup BOOLEAN DEFAULT true,
  p_rate_limit_cleanup BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_jobs INT := 0;
  v_deleted_runs INT := 0;
  v_deleted_cache INT := 0;
  v_deleted_rate INT := 0;
  v_released_stuck INT := 0;
BEGIN
  -- Jobs completados/mortos
  DELETE FROM public.sna_jobs
  WHERE status IN ('succeeded', 'dead', 'cancelled')
    AND created_at < NOW() - (p_job_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_jobs = ROW_COUNT;
  
  -- Tool runs
  DELETE FROM public.sna_tool_runs
  WHERE created_at < NOW() - (p_tool_run_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_runs = ROW_COUNT;
  
  -- Cache expirado
  IF p_cache_cleanup THEN
    DELETE FROM public.sna_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS v_deleted_cache = ROW_COUNT;
  END IF;
  
  -- Rate limits antigos
  IF p_rate_limit_cleanup THEN
    DELETE FROM public.sna_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS v_deleted_rate = ROW_COUNT;
  END IF;
  
  -- Liberar jobs travados (>30min)
  UPDATE public.sna_jobs
  SET status = 'pending', locked_at = NULL, locked_by = NULL, lock_token = NULL
  WHERE status = 'running' AND locked_at < NOW() - INTERVAL '30 minutes';
  GET DIAGNOSTICS v_released_stuck = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_jobs', v_deleted_jobs,
    'deleted_tool_runs', v_deleted_runs,
    'deleted_cache', v_deleted_cache,
    'deleted_rate_limits', v_deleted_rate,
    'released_stuck_jobs', v_released_stuck
  );
END;
$$;

-- ============================================================
-- PARTE 5: RLS COMPLETO
-- ============================================================

ALTER TABLE public.sna_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_healthchecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_embeddings ENABLE ROW LEVEL SECURITY;

-- Função de verificação de admin SNA (usando user_roles)
CREATE OR REPLACE FUNCTION public.is_sna_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  RETURN v_role IN ('owner', 'admin', 'coordenacao');
END;
$$;

-- Políticas para sna_jobs
DROP POLICY IF EXISTS "sna_jobs_select" ON public.sna_jobs;
CREATE POLICY "sna_jobs_select" ON public.sna_jobs
  FOR SELECT USING (created_by = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "sna_jobs_insert" ON public.sna_jobs;
CREATE POLICY "sna_jobs_insert" ON public.sna_jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "sna_jobs_update" ON public.sna_jobs;
CREATE POLICY "sna_jobs_update" ON public.sna_jobs
  FOR UPDATE USING (is_sna_admin());

-- Políticas para sna_tool_runs
DROP POLICY IF EXISTS "sna_tool_runs_select" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_select" ON public.sna_tool_runs
  FOR SELECT USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "sna_tool_runs_insert" ON public.sna_tool_runs;
CREATE POLICY "sna_tool_runs_insert" ON public.sna_tool_runs
  FOR INSERT WITH CHECK (TRUE);

-- Políticas para admin-only
DROP POLICY IF EXISTS "sna_budgets_admin" ON public.sna_budgets;
CREATE POLICY "sna_budgets_admin" ON public.sna_budgets
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "sna_health_admin" ON public.sna_healthchecks;
CREATE POLICY "sna_health_admin" ON public.sna_healthchecks
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "sna_flags_select" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_select" ON public.sna_feature_flags
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "sna_flags_manage" ON public.sna_feature_flags;
CREATE POLICY "sna_flags_manage" ON public.sna_feature_flags
  FOR ALL USING (is_sna_admin());

DROP POLICY IF EXISTS "sna_rate_all" ON public.sna_rate_limits;
CREATE POLICY "sna_rate_all" ON public.sna_rate_limits FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "sna_cache_all" ON public.sna_cache;
CREATE POLICY "sna_cache_all" ON public.sna_cache FOR ALL USING (TRUE);

-- Políticas para conversations
DROP POLICY IF EXISTS "sna_conv_own" ON public.sna_conversations;
CREATE POLICY "sna_conv_own" ON public.sna_conversations
  FOR ALL USING (user_id = auth.uid() OR is_sna_admin());

DROP POLICY IF EXISTS "sna_msg_own" ON public.sna_messages;
CREATE POLICY "sna_msg_own" ON public.sna_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sna_conversations c 
      WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR is_sna_admin())
    )
  );

DROP POLICY IF EXISTS "sna_embed_admin" ON public.sna_embeddings;
CREATE POLICY "sna_embed_admin" ON public.sna_embeddings
  FOR ALL USING (is_sna_admin());

-- ============================================================
-- PARTE 6: DADOS INICIAIS
-- ============================================================

-- Feature Flags
INSERT INTO public.sna_feature_flags (flag_key, category, description, is_enabled, allowed_roles, rollout_percentage) VALUES
  ('sna.tutor.enabled', 'tutor', 'IA Tutor para alunos', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.tutor.streaming', 'tutor', 'Streaming de respostas', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.tutor.context_window', 'tutor', 'Janela de contexto expandida', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.flashcards.generate', 'content', 'Geração de flashcards', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.mindmap.generate', 'content', 'Geração de mapas mentais', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.cronograma.generate', 'content', 'Geração de cronogramas', TRUE, ARRAY['owner', 'admin', 'beta'], 100),
  ('sna.import.url', 'admin', 'Importar questões de URL', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.import.pdf', 'admin', 'Importar questões de PDF', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.live.summary', 'live', 'Resumo de perguntas em lives', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.whatsapp.auto', 'automation', 'Automações WhatsApp', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.email.auto', 'automation', 'Automações de email', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.voice.narration', 'content', 'Narração com voz', FALSE, ARRAY['owner'], 50),
  ('sna.perplexity.web', 'tools', 'Respostas com fontes web', FALSE, ARRAY['owner', 'admin'], 30),
  ('sna.rag.enabled', 'advanced', 'RAG para contexto', TRUE, ARRAY['owner', 'admin'], 100),
  ('sna.cache.responses', 'performance', 'Cache de respostas', TRUE, ARRAY['owner', 'admin', 'beta'], 100)
ON CONFLICT (flag_key) DO UPDATE SET updated_at = NOW();

-- Budgets iniciais
INSERT INTO public.sna_budgets (scope, scope_id, period, period_start, period_end, limit_usd, limit_requests, limit_tokens) VALUES
  ('global', 'global', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 200.00, 100000, 50000000),
  ('global', 'global', 'day', date_trunc('day', NOW()), date_trunc('day', NOW()) + INTERVAL '1 day', 20.00, 10000, 5000000),
  ('tool', 'gpt5', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 80.00, NULL, NULL),
  ('tool', 'gemini_pro', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 50.00, NULL, NULL),
  ('tool', 'gemini_flash', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 30.00, NULL, NULL),
  ('tool', 'perplexity', 'month', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month', 20.00, NULL, NULL),
  ('role', 'beta', 'day', date_trunc('day', NOW()), date_trunc('day', NOW()) + INTERVAL '1 day', 2.00, 100, 100000)
ON CONFLICT (scope, scope_id, period, period_start) DO NOTHING;

-- ============================================================
-- PARTE 7: REALTIME
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_jobs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_healthchecks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE public.sna_jobs IS 'SNA OMEGA: Fila de jobs com idempotência, retry inteligente, hierarquia e métricas completas';
COMMENT ON TABLE public.sna_tool_runs IS 'SNA OMEGA: Auditoria detalhada de todas as chamadas a ferramentas de IA';
COMMENT ON TABLE public.sna_budgets IS 'SNA OMEGA: Controle de orçamento multi-dimensional com ações automáticas';
COMMENT ON TABLE public.sna_healthchecks IS 'SNA OMEGA: Histórico de healthchecks com detecção de mudanças';
COMMENT ON TABLE public.sna_feature_flags IS 'SNA OMEGA: Feature flags avançados com segmentação e rollout';
COMMENT ON TABLE public.sna_rate_limits IS 'SNA OMEGA: Rate limiting avançado com penalidades';
COMMENT ON TABLE public.sna_cache IS 'SNA OMEGA: Cache inteligente com economia de custos';
COMMENT ON TABLE public.sna_conversations IS 'SNA OMEGA: Threads de conversação persistentes';
COMMENT ON TABLE public.sna_messages IS 'SNA OMEGA: Mensagens com feedback e ações';
COMMENT ON TABLE public.sna_embeddings IS 'SNA OMEGA: Vetores para RAG (Retrieval Augmented Generation)';