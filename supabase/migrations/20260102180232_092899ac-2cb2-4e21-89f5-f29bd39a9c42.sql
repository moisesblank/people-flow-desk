-- ═══════════════════════════════════════════════════════════════════════════════
-- QUESTION AI INTERVENTION AUDIT LOG v1.0
-- Política de Auditoria Permanente para Intervenções de IA
-- IMUTÁVEL após criação
-- ═══════════════════════════════════════════════════════════════════════════════

-- Tabela de logs de intervenção de IA em questões
CREATE TABLE IF NOT EXISTS public.question_ai_intervention_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação da questão (OBRIGATÓRIO)
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  
  -- Timestamp server-side (IMUTÁVEL)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Origem da intervenção
  source_file TEXT, -- Nome do arquivo Excel ou 'system'
  source_type TEXT NOT NULL DEFAULT 'import', -- 'import', 'edit', 'batch_inference', 'manual_trigger'
  
  -- Campo afetado
  field_affected TEXT NOT NULL, -- 'macro', 'micro', 'tema', 'subtema', 'difficulty', 'banca', 'ano', 'explanation'
  
  -- Valores antes e depois
  value_before TEXT, -- Valor original (pode ser NULL se estava vazio)
  value_after TEXT NOT NULL, -- Novo valor aplicado pela IA
  
  -- Descrição da ação
  action_description TEXT NOT NULL, -- Descrição legível do que foi feito
  
  -- Confiança da IA (0.0 a 1.0)
  ai_confidence_score NUMERIC(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  
  -- Modelo de IA usado
  ai_model_used TEXT DEFAULT 'infer-question-taxonomy',
  
  -- Metadados adicionais (JSON para extensibilidade)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Índices para performance
  CONSTRAINT valid_field_affected CHECK (
    field_affected IN ('macro', 'micro', 'tema', 'subtema', 'difficulty', 'banca', 'ano', 'explanation', 'tags', 'other')
  )
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_question_ai_logs_question_id ON public.question_ai_intervention_logs(question_id);
CREATE INDEX IF NOT EXISTS idx_question_ai_logs_created_at ON public.question_ai_intervention_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_ai_logs_field ON public.question_ai_intervention_logs(field_affected);
CREATE INDEX IF NOT EXISTS idx_question_ai_logs_source ON public.question_ai_intervention_logs(source_type);

-- Comentários para documentação
COMMENT ON TABLE public.question_ai_intervention_logs IS 'Audit log permanente e imutável de todas as intervenções de IA em questões. Policy v1.0';
COMMENT ON COLUMN public.question_ai_intervention_logs.question_id IS 'ID único da questão afetada (identidade respeitada)';
COMMENT ON COLUMN public.question_ai_intervention_logs.created_at IS 'Timestamp server-side (imutável após criação)';
COMMENT ON COLUMN public.question_ai_intervention_logs.value_before IS 'Valor original antes da intervenção (NULL se estava vazio)';
COMMENT ON COLUMN public.question_ai_intervention_logs.value_after IS 'Valor aplicado pela IA';
COMMENT ON COLUMN public.question_ai_intervention_logs.ai_confidence_score IS 'Score de confiança da IA (0.0 a 1.0)';

-- RLS: Apenas leitura para staff de gestão, escrita apenas via service_role
ALTER TABLE public.question_ai_intervention_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Staff pode visualizar todos os logs
CREATE POLICY "gestao_staff_can_view_ai_logs" 
ON public.question_ai_intervention_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'coordenacao')
  )
);

-- Policy: Ninguém pode deletar logs (imutabilidade)
-- Não criar policy de DELETE = bloqueado por padrão

-- Policy: Ninguém pode atualizar logs (imutabilidade)
-- Não criar policy de UPDATE = bloqueado por padrão

-- Policy: Apenas service_role pode inserir (via Edge Functions)
-- INSERT sem policy = apenas service_role pode inserir