-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Adicionar intervention_type à tabela question_ai_intervention_logs
-- POLÍTICA: Global AI Question Intervention Visibility Policy v1.0
-- ═══════════════════════════════════════════════════════════════════════════════

-- Criar ENUM para tipos de intervenção de IA
CREATE TYPE ai_intervention_type AS ENUM (
  'AI_AUTOFILL',           -- Campo vazio foi preenchido
  'AI_ADDITION',           -- Conteúdo novo foi criado (ex: explicação)
  'AI_CORRECTION',         -- Valor existente foi alterado
  'AI_SUGGESTION_APPLIED', -- Sugestão confirmada e aplicada
  'AI_CLASSIFICATION_INFERENCE' -- Associação de taxonomia inferida
);

-- Adicionar coluna intervention_type
ALTER TABLE public.question_ai_intervention_logs 
ADD COLUMN intervention_type ai_intervention_type NOT NULL DEFAULT 'AI_AUTOFILL';

-- Remover o DEFAULT para forçar especificação explícita em novos inserts
ALTER TABLE public.question_ai_intervention_logs 
ALTER COLUMN intervention_type DROP DEFAULT;

-- Criar índice para consultas por tipo
CREATE INDEX idx_question_ai_logs_type ON public.question_ai_intervention_logs(intervention_type);

-- Criar índice para busca rápida de questões com logs (para lista)
CREATE INDEX idx_question_ai_logs_question_exists ON public.question_ai_intervention_logs(question_id);

-- Comentário de documentação
COMMENT ON COLUMN public.question_ai_intervention_logs.intervention_type IS 
'Tipo de intervenção de IA: AI_AUTOFILL (preenchimento), AI_ADDITION (adição), AI_CORRECTION (correção), AI_SUGGESTION_APPLIED (sugestão aplicada), AI_CLASSIFICATION_INFERENCE (inferência de taxonomia)';