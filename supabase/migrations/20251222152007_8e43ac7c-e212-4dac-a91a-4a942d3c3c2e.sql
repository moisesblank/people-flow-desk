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
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_healthchecks;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sna_conversations;
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