-- Remover constraint antiga
ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;

-- Criar nova constraint com todos os tipos suportados
ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_question_type_check 
CHECK (question_type = ANY (ARRAY[
  'multiple_choice'::text, 
  'true_false'::text, 
  'essay'::text,
  'discursive'::text,
  'somatorio'::text,
  'vf'::text,
  'associacao'::text
]));