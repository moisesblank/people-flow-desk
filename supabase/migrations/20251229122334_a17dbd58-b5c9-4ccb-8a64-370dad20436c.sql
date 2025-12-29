
-- =====================================================
-- ATUALIZAÇÃO RLS: DELETE de alunos só ADMIN + OWNER
-- CONSTITUIÇÃO v10.x - P0 FIX
-- =====================================================

-- 1. DROP policies antigas de DELETE
DROP POLICY IF EXISTS "alunos_delete_v17" ON public.alunos;
DROP POLICY IF EXISTS "ent_delete_v17" ON public.entradas;
DROP POLICY IF EXISTS "enroll_delete_v17" ON public.enrollments;
DROP POLICY IF EXISTS "progress_delete_v17" ON public.lesson_progress;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- 2. Criar função auxiliar is_admin_or_owner se não existir
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- 3. NOVAS policies de DELETE - APENAS ADMIN ou OWNER
-- Tabela: alunos
CREATE POLICY "alunos_delete_admin_owner"
ON public.alunos
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Tabela: entradas (financeiro de alunos)
CREATE POLICY "entradas_delete_admin_owner"
ON public.entradas
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Tabela: enrollments (matrículas)
CREATE POLICY "enrollments_delete_admin_owner"
ON public.enrollments
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Tabela: lesson_progress (progresso de aulas)
CREATE POLICY "lesson_progress_delete_admin_owner"
ON public.lesson_progress
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Tabela: profiles (só OWNER pode deletar profiles diretamente)
CREATE POLICY "profiles_delete_owner_only"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- Tabela: user_roles (atualizar policy existente)
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
CREATE POLICY "user_roles_delete_admin_owner"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  is_admin_or_owner(auth.uid()) 
  AND role != 'owner'  -- NUNCA pode deletar role owner
);

-- 4. Tabelas adicionais relacionadas a alunos
-- comissoes
DROP POLICY IF EXISTS "comissoes_delete" ON public.comissoes;
CREATE POLICY "comissoes_delete_admin_owner"
ON public.comissoes
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- pagamentos_cursos
DROP POLICY IF EXISTS "pagamentos_delete" ON public.pagamentos_cursos;
CREATE POLICY "pagamentos_delete_admin_owner"
ON public.pagamentos_cursos
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- certificates
DROP POLICY IF EXISTS "certificates_delete" ON public.certificates;
CREATE POLICY "certificates_delete_admin_owner"
ON public.certificates
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- quiz_attempts
DROP POLICY IF EXISTS "quiz_delete" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_delete_admin_owner"
ON public.quiz_attempts
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- question_attempts
DROP POLICY IF EXISTS "question_delete" ON public.question_attempts;
CREATE POLICY "question_attempts_delete_admin_owner"
ON public.question_attempts
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- lesson_annotations
DROP POLICY IF EXISTS "annotations_delete" ON public.lesson_annotations;
CREATE POLICY "lesson_annotations_delete_admin_owner"
ON public.lesson_annotations
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- user_achievements
DROP POLICY IF EXISTS "achievements_delete" ON public.user_achievements;
CREATE POLICY "user_achievements_delete_admin_owner"
ON public.user_achievements
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- user_badges
DROP POLICY IF EXISTS "badges_delete" ON public.user_badges;
CREATE POLICY "user_badges_delete_admin_owner"
ON public.user_badges
FOR DELETE
TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- 5. Comentário de auditoria
COMMENT ON POLICY "alunos_delete_admin_owner" ON public.alunos IS 
'CONSTITUIÇÃO v10.x: Apenas ADMIN ou OWNER podem excluir alunos definitivamente';
