-- ============================================
-- MIGRAÇÃO: Consolidar RLS BLOCO 3.1 - Lote 3 (8 tabelas)
-- ============================================

-- ====== 1. affiliates (6→5) ======
DROP POLICY IF EXISTS "Affiliate can update own or admin updates all" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view own or admin views all" ON public.affiliates;
DROP POLICY IF EXISTS "Only admin/owner can insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Only owner can delete affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_select_secure" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_update_owner_admin" ON public.affiliates;

CREATE POLICY "aff_select_v17" ON public.affiliates FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "aff_insert_v17" ON public.affiliates FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "aff_update_v17" ON public.affiliates FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "aff_delete_v17" ON public.affiliates FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "aff_service_v17" ON public.affiliates FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 2. editable_content (6→5) ======
DROP POLICY IF EXISTS "Admins can manage editable content" ON public.editable_content;
DROP POLICY IF EXISTS "Anyone can view editable content" ON public.editable_content;
DROP POLICY IF EXISTS "editable_content_public_read" ON public.editable_content;
DROP POLICY IF EXISTS "only_owner_can_delete_content" ON public.editable_content;
DROP POLICY IF EXISTS "only_owner_can_insert_content" ON public.editable_content;
DROP POLICY IF EXISTS "only_owner_can_update_content" ON public.editable_content;

-- Conteúdo público para leitura, só owner edita
CREATE POLICY "content_select_v17" ON public.editable_content FOR SELECT TO authenticated
USING (true);

CREATE POLICY "content_insert_v17" ON public.editable_content FOR INSERT TO authenticated
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "content_update_v17" ON public.editable_content FOR UPDATE TO authenticated
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "content_delete_v17" ON public.editable_content FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "content_service_v17" ON public.editable_content FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 3. live_chat_bans (6→5) ======
DROP POLICY IF EXISTS "Admins podem gerenciar bans" ON public.live_chat_bans;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio status de ban" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_delete" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_insert" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_select" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_update" ON public.live_chat_bans;

CREATE POLICY "bans_select_v17" ON public.live_chat_bans FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "bans_insert_v17" ON public.live_chat_bans FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "bans_update_v17" ON public.live_chat_bans FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "bans_delete_v17" ON public.live_chat_bans FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "bans_service_v17" ON public.live_chat_bans FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 4. sna_healthchecks (6→4) ======
DROP POLICY IF EXISTS "sna_health_admin" ON public.sna_healthchecks;
DROP POLICY IF EXISTS "sna_health_authenticated_read" ON public.sna_healthchecks;
DROP POLICY IF EXISTS "sna_health_owner_read" ON public.sna_healthchecks;
DROP POLICY IF EXISTS "sna_health_system_insert" ON public.sna_healthchecks;
DROP POLICY IF EXISTS "sna_healthchecks_insert" ON public.sna_healthchecks;
DROP POLICY IF EXISTS "sna_healthchecks_owner_admin" ON public.sna_healthchecks;

CREATE POLICY "health_select_v17" ON public.sna_healthchecks FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "health_insert_v17" ON public.sna_healthchecks FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "health_delete_v17" ON public.sna_healthchecks FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "health_service_v17" ON public.sna_healthchecks FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 5. sna_tool_runs (6→4) ======
DROP POLICY IF EXISTS "sna_tool_runs_insert" ON public.sna_tool_runs;
DROP POLICY IF EXISTS "sna_tool_runs_owner" ON public.sna_tool_runs;
DROP POLICY IF EXISTS "sna_tool_runs_owner_admin" ON public.sna_tool_runs;
DROP POLICY IF EXISTS "sna_tool_runs_owner_all" ON public.sna_tool_runs;
DROP POLICY IF EXISTS "sna_tool_runs_select" ON public.sna_tool_runs;
DROP POLICY IF EXISTS "sna_tool_runs_system_insert" ON public.sna_tool_runs;

CREATE POLICY "tools_select_v17" ON public.sna_tool_runs FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "tools_insert_v17" ON public.sna_tool_runs FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "tools_delete_v17" ON public.sna_tool_runs FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "tools_service_v17" ON public.sna_tool_runs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 6. payments (6→5) ======
DROP POLICY IF EXISTS "Admin manages payments" ON public.payments;
DROP POLICY IF EXISTS "Payments editable by financial" ON public.payments;
DROP POLICY IF EXISTS "Payments viewable by financial" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_financial" ON public.payments;
DROP POLICY IF EXISTS "payments_select_financial" ON public.payments;
DROP POLICY IF EXISTS "payments_update_financial" ON public.payments;

CREATE POLICY "pay_select_v17" ON public.payments FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "pay_insert_v17" ON public.payments FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "pay_update_v17" ON public.payments FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "pay_delete_v17" ON public.payments FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "pay_service_v17" ON public.payments FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 7. payment_transactions (6→5) ======
DROP POLICY IF EXISTS "payment_transactions_delete_admin" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_admin" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_select" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_select_admin" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_admin" ON public.payment_transactions;

CREATE POLICY "ptx_select_v17" ON public.payment_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ptx_insert_v17" ON public.payment_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "ptx_update_v17" ON public.payment_transactions FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "ptx_delete_v17" ON public.payment_transactions FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "ptx_service_v17" ON public.payment_transactions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 8. students (6→5) ======
DROP POLICY IF EXISTS "Admin owner only delete students" ON public.students;
DROP POLICY IF EXISTS "Admin owner only insert students" ON public.students;
DROP POLICY IF EXISTS "Admin owner only update students" ON public.students;
DROP POLICY IF EXISTS "Admin owner only view students" ON public.students;
DROP POLICY IF EXISTS "Students editable by admins" ON public.students;
DROP POLICY IF EXISTS "Students viewable by admins" ON public.students;

CREATE POLICY "stu_select_v17" ON public.students FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "stu_insert_v17" ON public.students FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "stu_update_v17" ON public.students FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "stu_delete_v17" ON public.students FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "stu_service_v17" ON public.students FOR ALL TO service_role
USING (true) WITH CHECK (true);