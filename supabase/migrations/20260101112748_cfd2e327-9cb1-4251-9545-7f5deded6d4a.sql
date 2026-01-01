-- ============================================
-- 🔥 ANIQUILAÇÃO TOTAL — CASCADE CONSTRAINTS
-- Garante que exclusão de questões propague
-- para TODAS as tabelas relacionadas
-- ============================================

-- 1. Adicionar CASCADE em question_attempts
ALTER TABLE public.question_attempts 
DROP CONSTRAINT IF EXISTS question_attempts_question_id_fkey;

ALTER TABLE public.question_attempts 
ADD CONSTRAINT question_attempts_question_id_fkey 
FOREIGN KEY (question_id) 
REFERENCES public.quiz_questions(id) 
ON DELETE CASCADE;

-- 2. Adicionar CASCADE em quiz_answers
ALTER TABLE public.quiz_answers 
DROP CONSTRAINT IF EXISTS quiz_answers_question_id_fkey;

ALTER TABLE public.quiz_answers 
ADD CONSTRAINT quiz_answers_question_id_fkey 
FOREIGN KEY (question_id) 
REFERENCES public.quiz_questions(id) 
ON DELETE CASCADE;

-- 3. Criar função de aniquilação total (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.annihilate_all_questions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_questions_count integer;
  v_attempts_count integer;
  v_answers_count integer;
  v_result jsonb;
BEGIN
  -- Verificar se é owner
  IF NOT public.is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas o Owner pode executar aniquilação total';
  END IF;

  -- Contar registros antes
  SELECT COUNT(*) INTO v_questions_count FROM quiz_questions;
  SELECT COUNT(*) INTO v_attempts_count FROM question_attempts;
  SELECT COUNT(*) INTO v_answers_count FROM quiz_answers;

  -- Deletar tudo (CASCADE propaga automaticamente)
  DELETE FROM quiz_questions WHERE id IS NOT NULL;

  -- Montar resultado
  v_result := jsonb_build_object(
    'success', true,
    'annihilated', jsonb_build_object(
      'quiz_questions', v_questions_count,
      'question_attempts', v_attempts_count,
      'quiz_answers', v_answers_count
    ),
    'timestamp', now(),
    'executed_by', auth.uid()
  );

  -- Log de auditoria
  INSERT INTO audit_logs (
    user_id, 
    action, 
    table_name, 
    metadata
  ) VALUES (
    auth.uid(),
    'TOTAL_ANNIHILATION',
    'quiz_questions',
    v_result
  );

  RETURN v_result;
END;
$$;

-- 4. Criar função de exclusão individual com CASCADE
CREATE OR REPLACE FUNCTION public.delete_question_cascade(p_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_count integer;
  v_answers_count integer;
  v_question_text text;
BEGIN
  -- Verificar permissão (owner ou admin)
  IF NOT public.is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas Owner/Admin podem excluir questões';
  END IF;

  -- Buscar dados da questão
  SELECT question_text INTO v_question_text 
  FROM quiz_questions WHERE id = p_question_id;

  IF v_question_text IS NULL THEN
    RAISE EXCEPTION 'Questão não encontrada: %', p_question_id;
  END IF;

  -- Contar dependências
  SELECT COUNT(*) INTO v_attempts_count 
  FROM question_attempts WHERE question_id = p_question_id;
  
  SELECT COUNT(*) INTO v_answers_count 
  FROM quiz_answers WHERE question_id = p_question_id;

  -- Deletar (CASCADE propaga)
  DELETE FROM quiz_questions WHERE id = p_question_id;

  -- Log de auditoria
  INSERT INTO audit_logs (
    user_id, 
    action, 
    table_name, 
    record_id,
    old_data,
    metadata
  ) VALUES (
    auth.uid(),
    'DELETE_CASCADE',
    'quiz_questions',
    p_question_id::text,
    jsonb_build_object('question_text', LEFT(v_question_text, 100)),
    jsonb_build_object(
      'cascaded_attempts', v_attempts_count,
      'cascaded_answers', v_answers_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_question', p_question_id,
    'cascaded', jsonb_build_object(
      'question_attempts', v_attempts_count,
      'quiz_answers', v_answers_count
    )
  );
END;
$$;

-- 5. Comentários de documentação
COMMENT ON FUNCTION public.annihilate_all_questions() IS 
'ANIQUILAÇÃO TOTAL: Remove TODAS as questões e registros relacionados. Owner only.';

COMMENT ON FUNCTION public.delete_question_cascade(uuid) IS 
'Exclui uma questão com CASCADE para attempts e answers. Owner/Admin only.';