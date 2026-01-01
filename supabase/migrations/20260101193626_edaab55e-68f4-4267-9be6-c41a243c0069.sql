-- Permitir DELETE apenas para admin/owner (necessário para ANIQUILAÇÃO do MODO_TREINO)
-- Patch-only: adiciona policy sem alterar estrutura/tabelas.

CREATE POLICY "questions_delete_v17"
ON public.quiz_questions
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));