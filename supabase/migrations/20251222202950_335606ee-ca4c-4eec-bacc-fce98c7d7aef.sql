-- ============================================================
-- SNA OMEGA v5.0 - PARTE 5: RLS COMPLETO + DADOS INICIAIS
-- ============================================================

-- Habilitar RLS em todas as tabelas SNA
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

-- Função de verificação de admin SNA
CREATE OR REPLACE FUNCTION public.is_sna_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
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

-- Feature Flags iniciais
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

-- Realtime
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

-- Comentários
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
COMMENT ON FUNCTION public.is_sna_admin IS '🧠 SNA: Verifica se usuário é admin do SNA';

-- ============================================================
-- 🔥 VIDEO FORTRESS ULTRA v2.0
-- Sistema de Proteção de Vídeos DEFINITIVO
-- ============================================================

-- Enums para Video Fortress
DO $$ BEGIN
    CREATE TYPE video_session_status AS ENUM ('active', 'expired', 'revoked', 'ended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE video_violation_type AS ENUM (
        'devtools_open',
        'screenshot_attempt',
        'screen_recording',
        'multiple_sessions',
        'invalid_domain',
        'expired_token',
        'keyboard_shortcut',
        'context_menu',
        'drag_attempt',
        'copy_attempt',
        'visibility_abuse',
        'iframe_manipulation',
        'network_tampering',
        'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE video_action_type AS ENUM (
        'authorize',
        'play_start',
        'play_resume',
        'pause',
        'seek',
        'quality_change',
        'speed_change',
        'heartbeat',
        'buffer_start',
        'buffer_end',
        'complete',
        'error',
        'violation'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tabela: video_play_sessions
CREATE TABLE IF NOT EXISTS public.video_play_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificação do conteúdo
    lesson_id UUID NULL,
    course_id UUID NULL,
    provider TEXT NOT NULL DEFAULT 'panda',
    provider_video_id TEXT NOT NULL,
    
    -- Sessão/forense
    session_code TEXT NOT NULL UNIQUE,
    session_token TEXT NOT NULL UNIQUE,
    watermark_text TEXT NOT NULL,
    watermark_hash TEXT NOT NULL,
    
    -- Status e timing
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    revoke_reason TEXT NULL,
    ended_at TIMESTAMPTZ NULL,
    
    -- Métricas de watch
    total_watch_time_seconds INTEGER DEFAULT 0,
    max_position_seconds INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Telemetria
    ip_address INET NULL,
    user_agent TEXT NULL,
    device_fingerprint TEXT NULL,
    country_code TEXT NULL,
    
    -- Risk score
    risk_score INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0
);

-- Índices otimizados para video_play_sessions
CREATE INDEX IF NOT EXISTS idx_vps_user_id ON public.video_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_lesson_id ON public.video_play_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vps_provider_video ON public.video_play_sessions(provider, provider_video_id);
CREATE INDEX IF NOT EXISTS idx_vps_status ON public.video_play_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vps_active_user ON public.video_play_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vps_session_token ON public.video_play_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_vps_expires ON public.video_play_sessions(expires_at) WHERE status = 'active';

-- RLS para video_play_sessions
ALTER TABLE public.video_play_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_sessions_user_access" ON public.video_play_sessions;
CREATE POLICY "video_sessions_user_access" ON public.video_play_sessions
  FOR ALL USING (user_id = auth.uid() OR is_sna_admin());

COMMENT ON TABLE public.video_play_sessions IS '🔥 VIDEO FORTRESS: Sessões de playback com anti-compartilhamento e rastreio forense';