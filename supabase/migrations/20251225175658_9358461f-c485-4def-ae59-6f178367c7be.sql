-- ============================================
-- MIGRAÇÃO: Consolidar RLS BLOCO 3.1 - Lote 1 (5 tabelas)
-- ============================================

-- ====== 1. company_fixed_expenses (12→5) ======
DROP POLICY IF EXISTS "Company fixed expenses editable by financial" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "Company fixed expenses viewable by financial" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "Owner/Admin manages company fixed expenses" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_delete_owner" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_insert_finance" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_select_finance" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "company_fixed_update_finance" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "fixed_exp_delete" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "fixed_exp_insert" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "fixed_exp_select" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "fixed_exp_update" ON public.company_fixed_expenses;
DROP POLICY IF EXISTS "owner_update_fixed_expenses" ON public.company_fixed_expenses;

CREATE POLICY "fixed_select_v17" ON public.company_fixed_expenses FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "fixed_insert_v17" ON public.company_fixed_expenses FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "fixed_update_v17" ON public.company_fixed_expenses FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "fixed_delete_v17" ON public.company_fixed_expenses FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "fixed_service_v17" ON public.company_fixed_expenses FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 2. company_extra_expenses (8→5) ======
DROP POLICY IF EXISTS "Company extra expenses editable by financial" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "Company extra expenses viewable by financial" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "Owner/Admin manages company extra expenses" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_delete_owner" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_insert_finance" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_select_finance" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "company_extra_update_finance" ON public.company_extra_expenses;
DROP POLICY IF EXISTS "owner_update_extra_expenses" ON public.company_extra_expenses;

CREATE POLICY "extra_select_v17" ON public.company_extra_expenses FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "extra_insert_v17" ON public.company_extra_expenses FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "extra_update_v17" ON public.company_extra_expenses FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "extra_delete_v17" ON public.company_extra_expenses FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "extra_service_v17" ON public.company_extra_expenses FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 3. whatsapp_leads (8→5) ======
DROP POLICY IF EXISTS "whatsapp_leads_delete_owner" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_insert_v17" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_select_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_select_v17" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_service_insert" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_update_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_update_v17" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_v18" ON public.whatsapp_leads;

CREATE POLICY "leads_select_v17" ON public.whatsapp_leads FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "leads_insert_v17" ON public.whatsapp_leads FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "leads_update_v17" ON public.whatsapp_leads FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "leads_delete_v17" ON public.whatsapp_leads FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "leads_service_v17" ON public.whatsapp_leads FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 4. sna_feature_flags (7→5) ======
DROP POLICY IF EXISTS "sna_feature_flags_owner_admin" ON public.sna_feature_flags;
DROP POLICY IF EXISTS "sna_flags_admin_all" ON public.sna_feature_flags;
DROP POLICY IF EXISTS "sna_flags_manage" ON public.sna_feature_flags;
DROP POLICY IF EXISTS "sna_flags_owner_all" ON public.sna_feature_flags;
DROP POLICY IF EXISTS "sna_flags_read_all" ON public.sna_feature_flags;
DROP POLICY IF EXISTS "sna_flags_read_enabled" ON public.sna_feature_flags;
DROP POLICY IF EXISTS "sna_flags_select" ON public.sna_feature_flags;

-- Flags são lidas por todos (feature toggles), mas só admin/owner gerencia
CREATE POLICY "flags_select_v17" ON public.sna_feature_flags FOR SELECT TO authenticated
USING (is_enabled = true OR is_admin_or_owner(auth.uid()));

CREATE POLICY "flags_insert_v17" ON public.sna_feature_flags FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "flags_update_v17" ON public.sna_feature_flags FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "flags_delete_v17" ON public.sna_feature_flags FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "flags_service_v17" ON public.sna_feature_flags FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ====== 5. gastos (7→5) ======
DROP POLICY IF EXISTS "Financial can manage gastos" ON public.gastos;
DROP POLICY IF EXISTS "gastos_delete_financial" ON public.gastos;
DROP POLICY IF EXISTS "gastos_financial_v18" ON public.gastos;
DROP POLICY IF EXISTS "gastos_insert_financial" ON public.gastos;
DROP POLICY IF EXISTS "gastos_select_financial" ON public.gastos;
DROP POLICY IF EXISTS "gastos_service_insert" ON public.gastos;
DROP POLICY IF EXISTS "gastos_update_financial" ON public.gastos;

CREATE POLICY "gastos_select_v17" ON public.gastos FOR SELECT TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "gastos_insert_v17" ON public.gastos FOR INSERT TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "gastos_update_v17" ON public.gastos FOR UPDATE TO authenticated
USING (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK (public.can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "gastos_delete_v17" ON public.gastos FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "gastos_service_v17" ON public.gastos FOR ALL TO service_role
USING (true) WITH CHECK (true);