-- Atualizar constraint valid_field_affected para incluir 'ano'
ALTER TABLE public.question_ai_intervention_logs 
DROP CONSTRAINT IF EXISTS valid_field_affected;

ALTER TABLE public.question_ai_intervention_logs 
ADD CONSTRAINT valid_field_affected CHECK (
  field_affected IN (
    'macro', 'micro', 'tema', 'subtema', 
    'difficulty', 'banca', 'ano',
    'tempo_medio_segundos', 'tags', 'explanation',
    'question_text', 'options', 'correct_answer',
    'question_type', 'source', 'metadata'
  )
);