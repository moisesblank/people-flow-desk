-- ============================================================
-- SNA OMEGA v5.0 - PARTE 3b: Adicionar tabelas e políticas faltantes
-- ============================================================

-- Extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2.10 SNA_EMBEDDINGS (se não existir)
CREATE TABLE IF NOT EXISTS public.sna_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  chunk_index INT DEFAULT 0,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding extensions.vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS sna_embed_source_idx ON public.sna_embeddings (source_type, source_id);
CREATE INDEX IF NOT EXISTS sna_embed_hash_idx ON public.sna_embeddings (content_hash);

-- Habilitar RLS nas tabelas que possam não ter
ALTER TABLE public.sna_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sna_embeddings ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes e recriar
DROP POLICY IF EXISTS "sna_rate_system" ON public.sna_rate_limits;
DROP POLICY IF EXISTS "sna_cache_system" ON public.sna_cache;
DROP POLICY IF EXISTS "sna_conv_user_own" ON public.sna_conversations;
DROP POLICY IF EXISTS "sna_conv_admin_all" ON public.sna_conversations;
DROP POLICY IF EXISTS "sna_msg_user" ON public.sna_messages;
DROP POLICY IF EXISTS "sna_msg_admin" ON public.sna_messages;
DROP POLICY IF EXISTS "sna_embed_read" ON public.sna_embeddings;
DROP POLICY IF EXISTS "sna_embed_admin" ON public.sna_embeddings;

-- Recriar políticas
CREATE POLICY "sna_rate_system" ON public.sna_rate_limits FOR ALL USING (true);
CREATE POLICY "sna_cache_system" ON public.sna_cache FOR ALL USING (true);

CREATE POLICY "sna_conv_user_own" ON public.sna_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sna_conv_admin_all" ON public.sna_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_msg_user" ON public.sna_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sna_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "sna_msg_admin" ON public.sna_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "sna_embed_read" ON public.sna_embeddings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sna_embed_admin" ON public.sna_embeddings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.sna_update_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sna_jobs_updated ON public.sna_jobs;
CREATE TRIGGER tr_sna_jobs_updated
  BEFORE UPDATE ON public.sna_jobs
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_budgets_updated ON public.sna_budgets;
CREATE TRIGGER tr_sna_budgets_updated
  BEFORE UPDATE ON public.sna_budgets
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_flags_updated ON public.sna_feature_flags;
CREATE TRIGGER tr_sna_flags_updated
  BEFORE UPDATE ON public.sna_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

DROP TRIGGER IF EXISTS tr_sna_conv_updated ON public.sna_conversations;
CREATE TRIGGER tr_sna_conv_updated
  BEFORE UPDATE ON public.sna_conversations
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_timestamp();

CREATE OR REPLACE FUNCTION public.sna_update_conversation_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.sna_conversations
  SET 
    message_count = message_count + 1,
    total_tokens = total_tokens + COALESCE(NEW.tokens, 0),
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sna_message_stats ON public.sna_messages;
CREATE TRIGGER tr_sna_message_stats
  AFTER INSERT ON public.sna_messages
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_conversation_stats();

-- ============================================================
-- FUNÇÃO CORE: sna_create_job
-- ============================================================

CREATE OR REPLACE FUNCTION public.sna_create_job(
  p_job_type TEXT,
  p_idempotency_key TEXT,
  p_input JSONB DEFAULT '{}'::jsonb,
  p_priority INT DEFAULT 3,
  p_run_after TIMESTAMPTZ DEFAULT NOW(),
  p_deadline TIMESTAMPTZ DEFAULT NULL,
  p_max_attempts INT DEFAULT 5,
  p_timeout_seconds INT DEFAULT 300,
  p_parent_job_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_job_id UUID;
  v_existing RECORD;
  v_root_job_id UUID;
  v_step INT;
BEGIN
  SELECT id, status INTO v_existing
  FROM public.sna_jobs
  WHERE job_type = p_job_type AND idempotency_key = p_idempotency_key;
  
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'job_id', v_existing.id,
      'status', v_existing.status,
      'is_new', false
    );
  END IF;
  
  IF p_parent_job_id IS NOT NULL THEN
    SELECT root_job_id, step_number INTO v_root_job_id, v_step
    FROM public.sna_jobs WHERE id = p_parent_job_id;
    
    v_root_job_id := COALESCE(v_root_job_id, p_parent_job_id);
    v_step := COALESCE(v_step, 0) + 1;
  END IF;
  
  INSERT INTO public.sna_jobs (
    job_type, idempotency_key, input, priority, run_after, deadline,
    max_attempts, timeout_seconds, parent_job_id, root_job_id, step_number,
    tags, metadata, created_by
  ) VALUES (
    p_job_type, p_idempotency_key, p_input, p_priority, p_run_after, p_deadline,
    p_max_attempts, p_timeout_seconds, p_parent_job_id, v_root_job_id, COALESCE(v_step, 1),
    p_tags, p_metadata, auth.uid()
  )
  RETURNING id INTO v_job_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'status', 'pending',
    'is_new', true
  );
END;
$$;

COMMENT ON TABLE public.sna_embeddings IS '🧠 SNA: Vetores de embedding para RAG';
COMMENT ON FUNCTION public.sna_create_job IS '🧠 SNA: Criar job com idempotência e hierarquia';