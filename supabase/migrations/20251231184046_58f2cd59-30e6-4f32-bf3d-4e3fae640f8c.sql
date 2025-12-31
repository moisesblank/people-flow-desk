-- ============================================
-- MIGRAÇÃO: Estrutura Hierárquica de Questões
-- 4 Níveis: MACRO → MICRO → TEMA → SUBTEMA
-- + Metadados adicionais
-- ============================================

-- Adicionar colunas hierárquicas à tabela quiz_questions
DO $$ 
BEGIN
  -- MACRO (ex: Química Geral, Química Orgânica, Físico-Química)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'macro') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN macro TEXT;
  END IF;
  
  -- MICRO (ex: Introdução à Inorgânica, Funções Orgânicas)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'micro') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN micro TEXT;
  END IF;
  
  -- TEMA (ex: Separação de Mistura, Hidrocarbonetos)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'tema') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN tema TEXT;
  END IF;
  
  -- SUBTEMA (ex: Mistura Homogênea, Alcanos)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'subtema') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN subtema TEXT;
  END IF;
  
  -- ÓRGÃO/CARGO (ex: PRF, TRF, Receita Federal)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'orgao_cargo') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN orgao_cargo TEXT;
  END IF;
END $$;

-- Criar índices para performance em filtros
CREATE INDEX IF NOT EXISTS idx_quiz_questions_macro ON public.quiz_questions(macro);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_micro ON public.quiz_questions(micro);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_tema ON public.quiz_questions(tema);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_subtema ON public.quiz_questions(subtema);

-- Comentários para documentação
COMMENT ON COLUMN public.quiz_questions.macro IS 'Nível 1: Área principal (ex: Química Geral)';
COMMENT ON COLUMN public.quiz_questions.micro IS 'Nível 2: Subárea (ex: Introdução à Inorgânica)';
COMMENT ON COLUMN public.quiz_questions.tema IS 'Nível 3: Tema específico (ex: Separação de Mistura)';
COMMENT ON COLUMN public.quiz_questions.subtema IS 'Nível 4: Subtema detalhado (ex: Mistura Homogênea)';
COMMENT ON COLUMN public.quiz_questions.orgao_cargo IS 'Órgão ou cargo do concurso (ex: PRF, TRF)';