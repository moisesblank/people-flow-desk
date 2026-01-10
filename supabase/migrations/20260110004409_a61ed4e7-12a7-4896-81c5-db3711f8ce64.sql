-- Remover linhas com campos inválidos e recriar constraint
DELETE FROM public.question_ai_intervention_logs 
WHERE field_affected NOT IN (
  'macro', 'micro', 'tema', 'subtema', 
  'difficulty', 'banca', 'year', 'correct_answer',
  'explanation', 'question_type', 'nivel_cognitivo',
  'origem', 'tags', 'competencia_enem', 'habilidade_enem',
  'options', 'question_text', 'image_url', 'images',
  'status_revisao', 'tempo_medio_segundos'
);

-- Remover constraint antiga
ALTER TABLE public.question_ai_intervention_logs 
DROP CONSTRAINT IF EXISTS valid_field_affected;

-- Adicionar constraint atualizada
ALTER TABLE public.question_ai_intervention_logs
ADD CONSTRAINT valid_field_affected CHECK (
  field_affected IN (
    'macro', 'micro', 'tema', 'subtema', 
    'difficulty', 'banca', 'year', 'correct_answer',
    'explanation', 'question_type', 'nivel_cognitivo',
    'origem', 'tags', 'competencia_enem', 'habilidade_enem',
    'options', 'question_text', 'image_url', 'images',
    'status_revisao', 'tempo_medio_segundos'
  )
);