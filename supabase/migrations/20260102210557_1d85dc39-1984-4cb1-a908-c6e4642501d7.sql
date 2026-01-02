-- Atualizar constraint para incluir nivel_cognitivo como campo válido
ALTER TABLE public.question_ai_intervention_logs 
DROP CONSTRAINT IF EXISTS valid_field_affected;

ALTER TABLE public.question_ai_intervention_logs 
ADD CONSTRAINT valid_field_affected CHECK (
  field_affected IN ('macro', 'micro', 'tema', 'subtema', 'difficulty', 'banca', 'ano', 'explanation', 'tags', 'nivel_cognitivo', 'other')
);