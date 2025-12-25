-- ============================================
-- MIGRAÇÃO: Consolidar RLS BLOCO 3.1 - Lote 2 (6 tabelas)
-- ============================================

-- ====== 1. audit_logs (6→4) ======
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only service role can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_owner" ON public.audit_logs;

-- Audit logs: Owner lê, sistema insere
CREATE POLICY "audit_select_v17" ON public.audit_logs FOR SELECT TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "audit_insert_v17" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "audit_delete_v17" ON public.audit_logs FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "audit_service_v17" ON public.audit_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 2. book_ratings (6→5) ======
DROP POLICY IF EXISTS "book_ratings_delete" ON public.book_ratings;
DROP POLICY IF EXISTS "book_ratings_insert" ON public.book_ratings;
DROP POLICY IF EXISTS "book_ratings_own" ON public.book_ratings;
DROP POLICY IF EXISTS "book_ratings_public_read" ON public.book_ratings;
DROP POLICY IF EXISTS "book_ratings_select" ON public.book_ratings;
DROP POLICY IF EXISTS "book_ratings_update" ON public.book_ratings;

-- Avaliações públicas, mas só dono edita/deleta
CREATE POLICY "ratings_select_v17" ON public.book_ratings FOR SELECT TO authenticated
USING (is_public = true OR user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ratings_insert_v17" ON public.book_ratings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "ratings_update_v17" ON public.book_ratings FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ratings_delete_v17" ON public.book_ratings FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "ratings_service_v17" ON public.book_ratings FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 3. enrollments (6→5) ======
DROP POLICY IF EXISTS "Admin gerencia matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Usuário pode se matricular" ON public.enrollments;
DROP POLICY IF EXISTS "Usuário vê próprias matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "v16_enrollments_insert" ON public.enrollments;
DROP POLICY IF EXISTS "v16_enrollments_select" ON public.enrollments;
DROP POLICY IF EXISTS "v16_enrollments_update" ON public.enrollments;

CREATE POLICY "enroll_select_v17" ON public.enrollments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "enroll_insert_v17" ON public.enrollments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "enroll_update_v17" ON public.enrollments FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "enroll_delete_v17" ON public.enrollments FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "enroll_service_v17" ON public.enrollments FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 4. entradas (6→5) ======
DROP POLICY IF EXISTS "Service role full access entradas" ON public.entradas;
DROP POLICY IF EXISTS "entradas_delete_v17" ON public.entradas;
DROP POLICY IF EXISTS "entradas_insert_v17" ON public.entradas;
DROP POLICY IF EXISTS "entradas_select_v17" ON public.entradas;
DROP POLICY IF EXISTS "entradas_service_insert" ON public.entradas;
DROP POLICY IF EXISTS "entradas_update_v17" ON public.entradas;

CREATE POLICY "ent_select_v17" ON public.entradas FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ent_insert_v17" ON public.entradas FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ent_update_v17" ON public.entradas FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ent_delete_v17" ON public.entradas FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "ent_service_v17" ON public.entradas FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 5. lesson_progress (6→5) ======
DROP POLICY IF EXISTS "Admin vê progresso" ON public.lesson_progress;
DROP POLICY IF EXISTS "Usuário gerencia próprio progresso" ON public.lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_all" ON public.lesson_progress;
DROP POLICY IF EXISTS "v16_lesson_progress_insert" ON public.lesson_progress;
DROP POLICY IF EXISTS "v16_lesson_progress_select" ON public.lesson_progress;
DROP POLICY IF EXISTS "v16_lesson_progress_update" ON public.lesson_progress;

CREATE POLICY "progress_select_v17" ON public.lesson_progress FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "progress_insert_v17" ON public.lesson_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_update_v17" ON public.lesson_progress FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "progress_delete_v17" ON public.lesson_progress FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "progress_service_v17" ON public.lesson_progress FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 6. quiz_attempts (6→5) ======
DROP POLICY IF EXISTS "Admin vê todas tentativas" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Usuário gerencia próprias tentativas" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_all" ON public.quiz_attempts;
DROP POLICY IF EXISTS "v16_quiz_insert" ON public.quiz_attempts;
DROP POLICY IF EXISTS "v16_quiz_select" ON public.quiz_attempts;
DROP POLICY IF EXISTS "v16_quiz_update" ON public.quiz_attempts;

CREATE POLICY "quiz_select_v17" ON public.quiz_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "quiz_insert_v17" ON public.quiz_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "quiz_update_v17" ON public.quiz_attempts FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "quiz_delete_v17" ON public.quiz_attempts FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "quiz_service_v17" ON public.quiz_attempts FOR ALL TO service_role
USING (true) WITH CHECK (true);