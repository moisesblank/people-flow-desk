-- ============================================
-- MIGRATION v17.6c: CONSOLIDAÇÃO CORRIGIDA - PARTE 3
-- Usando colunas corretas para cada tabela
-- ============================================

-- ========== RECEIPT_OCR_EXTRACTIONS (admin-only, já sem as políticas antigas) ==========
CREATE POLICY "ocr_select" ON public.receipt_ocr_extractions FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "ocr_insert" ON public.receipt_ocr_extractions FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "ocr_update" ON public.receipt_ocr_extractions FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "ocr_delete" ON public.receipt_ocr_extractions FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- ========== CERTIFICATES (já sem políticas antigas) ==========
CREATE POLICY "certs_select" ON public.certificates FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "certs_insert" ON public.certificates FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "certs_update" ON public.certificates FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "certs_delete" ON public.certificates FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- ========== MARKETING_CAMPAIGNS (admin/marketing - sem user_id) ==========
CREATE POLICY "mkt_camp_select" ON public.marketing_campaigns FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'marketing'
));

CREATE POLICY "mkt_camp_insert" ON public.marketing_campaigns FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'marketing'
));

CREATE POLICY "mkt_camp_update" ON public.marketing_campaigns FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'marketing'
));

CREATE POLICY "mkt_camp_delete" ON public.marketing_campaigns FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- ========== COMPANY_FIXED_EXPENSES (finance - sem user_id) ==========
CREATE POLICY "fixed_exp_select" ON public.company_fixed_expenses FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'contabilidade'
));

CREATE POLICY "fixed_exp_insert" ON public.company_fixed_expenses FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'contabilidade'
));

CREATE POLICY "fixed_exp_update" ON public.company_fixed_expenses FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'contabilidade'
));

CREATE POLICY "fixed_exp_delete" ON public.company_fixed_expenses FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- ========== SNA_JOBS (usa created_by) ==========
CREATE POLICY "sna_select" ON public.sna_jobs FOR SELECT TO authenticated
USING (created_by = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "sna_insert" ON public.sna_jobs FOR INSERT TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "sna_update" ON public.sna_jobs FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "sna_delete" ON public.sna_jobs FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- ========== LIVE_CHAT_MESSAGES ==========
CREATE POLICY "chat_select" ON public.live_chat_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "chat_insert" ON public.live_chat_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_update" ON public.live_chat_messages FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_delete" ON public.live_chat_messages FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));