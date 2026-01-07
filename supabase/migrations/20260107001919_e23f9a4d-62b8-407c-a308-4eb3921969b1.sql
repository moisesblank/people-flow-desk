-- =============================================
-- P0 FIX: Permitir alunos beta verem questões MODO_TREINO
-- Problema: RLS só permitia SELECT se quiz_id tivesse quiz publicado
-- Questões avulsas (MODO_TREINO) não têm quiz_id = alunos não veem nada
-- =============================================

-- Remover política antiga
DROP POLICY IF EXISTS questions_select_v17 ON public.quiz_questions;

-- Nova política: permite SELECT se:
-- 1. Questão pertence a quiz publicado (simulados), OU
-- 2. Questão tem tag MODO_TREINO (prática avulsa), OU  
-- 3. Usuário é admin/owner (gestão)
CREATE POLICY questions_select_v18 ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  -- Admins/owners veem tudo
  is_admin_or_owner(auth.uid())
  OR
  -- Questões de quizzes publicados (simulados)
  EXISTS (
    SELECT 1 FROM quizzes q 
    WHERE q.id = quiz_questions.quiz_id 
    AND q.is_published = true
  )
  OR
  -- Questões com tag MODO_TREINO (prática para alunos) - DEVEM estar ativas
  (
    is_active = true 
    AND 'MODO_TREINO' = ANY(tags)
  )
);