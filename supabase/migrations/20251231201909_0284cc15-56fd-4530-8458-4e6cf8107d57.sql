-- ============================================
-- MIGRAÇÃO: Campos Pedagógicos Avançados para quiz_questions
-- Versão: 1.0.0
-- Data: 2025-01-01
-- ============================================

-- 1. Tempo Médio de Resolução (segundos)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS tempo_medio_segundos INTEGER DEFAULT 120;

-- 2. Nível Cognitivo (Taxonomia de Bloom)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS nivel_cognitivo TEXT DEFAULT 'aplicar'
CHECK (nivel_cognitivo IN ('memorizar', 'compreender', 'aplicar', 'analisar', 'avaliar'));

-- 3. Origem da Questão
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'oficial'
CHECK (origem IN ('oficial', 'adaptada', 'autoral_prof_moises'));

-- 4. Status de Revisão (workflow editorial)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS status_revisao TEXT DEFAULT 'rascunho'
CHECK (status_revisao IN ('rascunho', 'revisado', 'publicado'));

-- 5. Campos Inferidos (metadado de importação)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS campos_inferidos TEXT[] DEFAULT '{}';

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_nivel_cognitivo ON public.quiz_questions(nivel_cognitivo);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_origem ON public.quiz_questions(origem);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_status_revisao ON public.quiz_questions(status_revisao);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_tempo_medio ON public.quiz_questions(tempo_medio_segundos);

-- 7. Comentários para documentação
COMMENT ON COLUMN public.quiz_questions.tempo_medio_segundos IS 'Tempo médio esperado de resolução em segundos';
COMMENT ON COLUMN public.quiz_questions.nivel_cognitivo IS 'Nível cognitivo (Bloom): memorizar, compreender, aplicar, analisar, avaliar';
COMMENT ON COLUMN public.quiz_questions.origem IS 'Origem: oficial (banca), adaptada, autoral_prof_moises';
COMMENT ON COLUMN public.quiz_questions.status_revisao IS 'Workflow: rascunho → revisado → publicado';
COMMENT ON COLUMN public.quiz_questions.campos_inferidos IS 'Array com nomes dos campos auto-detectados na importação';