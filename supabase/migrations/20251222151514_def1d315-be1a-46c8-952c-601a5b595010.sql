-- ============================================================
-- 🧠 SNA OMEGA v5.0 - PARTE 8: CONVERSAÇÕES E FUNÇÕES CORE
-- ============================================================

-- 2.8 SNA_CONVERSATIONS: Threads de conversação
CREATE TABLE IF NOT EXISTS public.sna_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Contexto
  agent_type TEXT NOT NULL DEFAULT 'tutor',
  lesson_id UUID,
  course_id UUID,
  
  -- Estado
  title TEXT,
  status TEXT DEFAULT 'active',
  
  -- Métricas
  message_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  total_cost_usd NUMERIC(12, 8) DEFAULT 0,
  
  -- Última atividade
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

CREATE INDEX IF NOT EXISTS sna_conv_user_idx ON public.sna_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS sna_conv_agent_idx ON public.sna_conversations (agent_type, status);

-- RLS para sna_conversations
ALTER TABLE public.sna_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sna_conv_user_own" ON public.sna_conversations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "sna_conv_admin_all" ON public.sna_conversations
  FOR ALL USING (is_admin_or_owner(auth.uid()));

-- 2.9 SNA_MESSAGES: Mensagens de conversação
CREATE TABLE IF NOT EXISTS public.sna_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Referência
  conversation_id UUID NOT NULL REFERENCES public.sna_conversations(id) ON DELETE CASCADE,
  
  -- Mensagem
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
  content TEXT NOT NULL,
  
  -- Metadados
  tokens INT,
  model TEXT,
  latency_ms INT,
  
  -- Feedback
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Ações geradas
  actions JSONB,
  citations JSONB
);

CREATE INDEX IF NOT EXISTS sna_msg_conv_idx ON public.sna_messages (conversation_id, created_at);

-- RLS para sna_messages
ALTER TABLE public.sna_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sna_msg_user_own" ON public.sna_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sna_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "sna_msg_admin_all" ON public.sna_messages
  FOR ALL USING (is_admin_or_owner(auth.uid()));

-- 2.10 SNA_EMBEDDINGS: Vetores para RAG (sem VECTOR por enquanto)
CREATE TABLE IF NOT EXISTS public.sna_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Fonte
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  chunk_index INT DEFAULT 0,
  
  -- Conteúdo
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  
  -- Embedding armazenado como JSONB (array de floats)
  embedding JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tags para filtro
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS sna_embed_source_idx ON public.sna_embeddings (source_type, source_id);
CREATE INDEX IF NOT EXISTS sna_embed_hash_idx ON public.sna_embeddings (content_hash);

-- RLS para sna_embeddings
ALTER TABLE public.sna_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sna_embed_read_auth" ON public.sna_embeddings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sna_embed_admin_manage" ON public.sna_embeddings
  FOR ALL USING (is_admin_or_owner(auth.uid()));

-- ============================================================
-- PARTE 3: TRIGGERS AUTOMÁTICOS
-- ============================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.sna_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Trigger para atualizar conversation stats
CREATE OR REPLACE FUNCTION public.sna_update_conversation_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sna_message_stats ON public.sna_messages;
CREATE TRIGGER tr_sna_message_stats
  AFTER INSERT ON public.sna_messages
  FOR EACH ROW EXECUTE FUNCTION public.sna_update_conversation_stats();

-- ============================================================
-- PARTE 4: FUNÇÕES CORE DO SNA
-- ============================================================

-- 4.1 Criar job com validação completa
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
AS $$
DECLARE
  v_job_id UUID;
  v_existing RECORD;
  v_root_job_id UUID;
  v_step INT;
BEGIN
  -- Verificar se já existe
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
  
  -- Calcular hierarquia
  IF p_parent_job_id IS NOT NULL THEN
    SELECT root_job_id, step_number INTO v_root_job_id, v_step
    FROM public.sna_jobs WHERE id = p_parent_job_id;
    
    v_root_job_id := COALESCE(v_root_job_id, p_parent_job_id);
    v_step := COALESCE(v_step, 0) + 1;
  END IF;
  
  -- Criar job
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