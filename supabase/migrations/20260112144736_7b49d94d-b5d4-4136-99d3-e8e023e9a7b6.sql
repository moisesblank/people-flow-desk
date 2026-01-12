
-- P0 FIX: Corrigir política RLS de question_attempts para permitir INSERT
-- A política atual usa apenas USING sem WITH CHECK, bloqueando INSERTs

-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS question_attempts_all ON public.question_attempts;

-- Criar política de SELECT separada
CREATE POLICY "question_attempts_select_own" 
ON public.question_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Criar política de INSERT com WITH CHECK
CREATE POLICY "question_attempts_insert_own" 
ON public.question_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar política de UPDATE
CREATE POLICY "question_attempts_update_own" 
ON public.question_attempts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
