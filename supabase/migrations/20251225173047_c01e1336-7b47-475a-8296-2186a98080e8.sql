
-- ============================================
-- MIGRAÇÃO: Consolidar RLS - certificates (12→4)
-- ============================================

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admin gerencia certificados" ON public.certificates;
DROP POLICY IF EXISTS "Usuário vê próprios certificados" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_admin" ON public.certificates;
DROP POLICY IF EXISTS "certificates_select_secure" ON public.certificates;
DROP POLICY IF EXISTS "certificates_update_admin" ON public.certificates;
DROP POLICY IF EXISTS "certs_delete" ON public.certificates;
DROP POLICY IF EXISTS "certs_insert" ON public.certificates;
DROP POLICY IF EXISTS "certs_select" ON public.certificates;
DROP POLICY IF EXISTS "certs_update" ON public.certificates;
DROP POLICY IF EXISTS "v16_certificates_insert" ON public.certificates;
DROP POLICY IF EXISTS "v16_certificates_select" ON public.certificates;
DROP POLICY IF EXISTS "v16_certificates_update" ON public.certificates;

-- Criar 4 políticas consolidadas
CREATE POLICY "certs_select_v17" ON public.certificates
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "certs_insert_v17" ON public.certificates
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "certs_update_v17" ON public.certificates
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "certs_delete_v17" ON public.certificates
FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- ============================================
-- MIGRAÇÃO: Consolidar RLS - marketing_campaigns (12→4)
-- ============================================

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admin can manage marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Admins can delete marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Admins can insert marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Admins can update marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Admins can view marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "marketing_insert_admin" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "marketing_select_admin" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "marketing_update_admin" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "mkt_camp_delete" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "mkt_camp_insert" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "mkt_camp_select" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "mkt_camp_update" ON public.marketing_campaigns;

-- Criar 4 políticas consolidadas (inclui role marketing)
CREATE POLICY "mkt_select_v17" ON public.marketing_campaigns
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR is_marketing(auth.uid()));

CREATE POLICY "mkt_insert_v17" ON public.marketing_campaigns
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()) OR is_marketing(auth.uid()));

CREATE POLICY "mkt_update_v17" ON public.marketing_campaigns
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR is_marketing(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()) OR is_marketing(auth.uid()));

CREATE POLICY "mkt_delete_v17" ON public.marketing_campaigns
FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));
