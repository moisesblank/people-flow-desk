-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Adicionar 3 campos pedagógicos para importação expandida
-- SOMA PURA: Não altera nada existente, apenas adiciona colunas
-- ═══════════════════════════════════════════════════════════════════════════════

-- Campo: Fórmula principal da questão
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS main_formula TEXT;

-- Campo: Dica do professor
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS teacher_tip TEXT;

-- Campo: Erro comum (pegadinha frequente)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS common_error TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.quiz_questions.main_formula IS 'Fórmula principal utilizada na resolução da questão';
COMMENT ON COLUMN public.quiz_questions.teacher_tip IS 'Dica pedagógica do professor para resolver a questão';
COMMENT ON COLUMN public.quiz_questions.common_error IS 'Erro comum ou pegadinha frequente que alunos cometem';