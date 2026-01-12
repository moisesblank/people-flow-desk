
-- ============================================================
-- P0 FIX: Corrigir RLS policy quiz_questions para permitir
-- que alunos visualizem questões referenciadas em SIMULADOS
-- ============================================================

-- DROP da policy antiga
DROP POLICY IF EXISTS "questions_select_v18" ON public.quiz_questions;

-- Nova policy que inclui questões de simulados publicados
CREATE POLICY "questions_select_v19" ON public.quiz_questions
FOR SELECT TO authenticated
USING (
  -- Admins/Owner veem tudo
  is_admin_or_owner(auth.uid())
  
  -- Questões de quizzes publicados
  OR EXISTS (
    SELECT 1 FROM public.quizzes q 
    WHERE q.id = quiz_questions.quiz_id 
    AND q.is_published = true
  )
  
  -- Questões ativas com tag MODO_TREINO
  OR (is_active = true AND 'MODO_TREINO' = ANY(tags))
  
  -- P0 FIX: Questões referenciadas em simulados PUBLICADOS e ATIVOS
  -- Alunos autenticados podem ver questões que estão no array question_ids
  -- de simulados publicados (is_published = true) e ativos (is_active = true)
  OR EXISTS (
    SELECT 1 FROM public.simulados s
    WHERE s.is_published = true 
    AND s.is_active = true
    AND quiz_questions.id = ANY(s.question_ids)
  )
);

-- Comentário documentando a mudança
COMMENT ON POLICY "questions_select_v19" ON public.quiz_questions IS 
'RLS v19: Permite visualização de questões para (1) admins/owner, (2) quizzes publicados, (3) tag MODO_TREINO, (4) simulados publicados e ativos. P0 FIX para entidade Simulados.';
