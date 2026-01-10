-- ============================================
-- RASTREABILIDADE DE IMPORTAÇÕES v1.0
-- Vincular questões ao histórico de importação para permitir aniquilação em massa
-- ============================================

-- 1. Adicionar coluna import_history_id na tabela quiz_questions
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS import_history_id UUID REFERENCES public.question_import_history(id) ON DELETE SET NULL;

-- 2. Criar índice para queries eficientes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_import_history_id 
ON public.quiz_questions(import_history_id);

-- 3. Criar função RPC para aniquilar todas as questões de um histórico
CREATE OR REPLACE FUNCTION public.annihilate_import_batch(p_import_history_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_question_ids UUID[];
  v_history_record RECORD;
  v_result JSON;
BEGIN
  -- Verificar se o histórico existe
  SELECT * INTO v_history_record FROM question_import_history WHERE id = p_import_history_id;
  
  IF v_history_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Histórico não encontrado',
      'deleted_count', 0
    );
  END IF;
  
  -- Coletar IDs das questões antes de deletar
  SELECT ARRAY_AGG(id) INTO v_question_ids 
  FROM quiz_questions 
  WHERE import_history_id = p_import_history_id;
  
  -- Contar questões
  v_deleted_count := COALESCE(array_length(v_question_ids, 1), 0);
  
  IF v_deleted_count = 0 THEN
    -- Deletar o histórico mesmo sem questões
    DELETE FROM question_import_history WHERE id = p_import_history_id;
    
    RETURN json_build_object(
      'success', true,
      'deleted_count', 0,
      'history_deleted', true,
      'message', 'Histórico deletado (sem questões vinculadas)'
    );
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════
  -- ANIQUILAÇÃO EM CASCATA
  -- ═══════════════════════════════════════════════════════════════════
  
  -- 1. Deletar logs de intervenção de IA
  DELETE FROM question_ai_intervention_logs 
  WHERE question_id = ANY(v_question_ids);
  
  -- 2. Deletar respostas de quiz attempts
  DELETE FROM quiz_attempt_answers 
  WHERE question_id = ANY(v_question_ids);
  
  -- 3. Deletar do caderno de erros
  DELETE FROM error_notebook 
  WHERE question_id = ANY(v_question_ids);
  
  -- 4. Deletar questões principais
  DELETE FROM quiz_questions 
  WHERE id = ANY(v_question_ids);
  
  -- 5. Deletar histórico de importação
  DELETE FROM question_import_history WHERE id = p_import_history_id;
  
  -- Log de auditoria
  INSERT INTO audit_logs (action, table_name, record_id, metadata, user_id)
  VALUES (
    'IMPORT_BATCH_ANNIHILATED',
    'quiz_questions',
    p_import_history_id::text,
    json_build_object(
      'deleted_count', v_deleted_count,
      'question_ids', v_question_ids,
      'file_names', v_history_record.file_names,
      'target_group', v_history_record.target_group
    ),
    auth.uid()
  );
  
  RETURN json_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'history_deleted', true,
    'question_ids', v_question_ids,
    'file_names', v_history_record.file_names
  );
END;
$$;

-- Conceder acesso à função
GRANT EXECUTE ON FUNCTION public.annihilate_import_batch(UUID) TO authenticated;