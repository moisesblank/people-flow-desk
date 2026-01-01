-- Adicionar campos taxonômicos na tabela questions
-- PATCH-ONLY: Apenas ADD COLUMN, zero alteração em dados existentes

-- Campo para Macro Área (ex: quimica_organica, quimica_geral)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS macro_area TEXT;

-- Campo para Micro Área (ex: isomeria, funcoes_organicas)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS micro_area TEXT;

-- Campo para Tema (ex: isomeria_optica, alcanos)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS tema TEXT;

-- Campo para Subtema (ex: enantiomeros, diastereoisomeros)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS subtema TEXT;

-- Índices para performance em filtros hierárquicos
CREATE INDEX IF NOT EXISTS idx_questions_macro_area ON public.questions(macro_area);
CREATE INDEX IF NOT EXISTS idx_questions_micro_area ON public.questions(micro_area);
CREATE INDEX IF NOT EXISTS idx_questions_tema ON public.questions(tema);
CREATE INDEX IF NOT EXISTS idx_questions_taxonomy_combo ON public.questions(macro_area, micro_area, tema);

-- Comentários para documentação
COMMENT ON COLUMN public.questions.macro_area IS 'Macro área taxonômica (ex: quimica_organica)';
COMMENT ON COLUMN public.questions.micro_area IS 'Micro área taxonômica (ex: isomeria)';
COMMENT ON COLUMN public.questions.tema IS 'Tema específico (ex: isomeria_optica)';
COMMENT ON COLUMN public.questions.subtema IS 'Subtema opcional (ex: enantiomeros)';