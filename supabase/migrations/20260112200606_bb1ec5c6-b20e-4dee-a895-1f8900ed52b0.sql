
-- P0 FIX: Corrigir FK do error_notebook para apontar para quiz_questions
-- CAUSA RAIZ: error_notebook_question_id_fkey aponta para sanctuary_questions (vazia)
-- mas todas as questões estão em quiz_questions

-- 1. Remover FK antiga que aponta para sanctuary_questions
ALTER TABLE public.error_notebook 
DROP CONSTRAINT IF EXISTS error_notebook_question_id_fkey;

-- 2. Adicionar FK nova que aponta para quiz_questions
ALTER TABLE public.error_notebook 
ADD CONSTRAINT error_notebook_question_id_fkey 
FOREIGN KEY (question_id) 
REFERENCES public.quiz_questions(id) 
ON DELETE CASCADE;

-- 3. Atualizar o trigger para ser mais resiliente (FAIL-OPEN)
CREATE OR REPLACE FUNCTION public.fn_auto_error_notebook() RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se a questão existe em quiz_questions antes de inserir
    IF EXISTS (SELECT 1 FROM public.quiz_questions WHERE id = NEW.question_id) THEN
        IF NEW.is_correct = FALSE THEN
            INSERT INTO public.error_notebook (user_id, question_id) 
            VALUES (NEW.user_id, NEW.question_id)
            ON CONFLICT (user_id, question_id) 
            DO UPDATE SET 
                error_count = error_notebook.error_count + 1, 
                last_error_at = NOW(), 
                mastered = FALSE;
        ELSE
            UPDATE public.error_notebook 
            SET mastered = TRUE, mastered_at = NOW() 
            WHERE user_id = NEW.user_id 
            AND question_id = NEW.question_id 
            AND mastered = FALSE;
        END IF;
    END IF;
    -- ALWAYS return NEW to not break the question_attempts insert
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- FAIL-OPEN: Log error but don't break the main insert
    RAISE WARNING 'Error in fn_auto_error_notebook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
