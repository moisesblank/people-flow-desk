-- =====================================================
-- SECURITY HARDENING v17.2 - CONSOLIDAÇÃO PARTE 3
-- Data: 25/12/2025
-- Objetivo: Finalizar consolidação de policies
-- OWNER: moisesblank@gmail.com
-- =====================================================

-- =====================================================
-- CORRIGIR: whatsapp_messages (policies com WITH CHECK true)
-- =====================================================

DROP POLICY IF EXISTS "Service inserts whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "wa_messages_insert_service" ON public.whatsapp_messages;

-- Criar policy segura para service role
CREATE POLICY "whatsapp_messages_service_insert" ON public.whatsapp_messages
FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- Remover policies duplicadas de whatsapp_messages
DROP POLICY IF EXISTS "Admin can manage whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admin manages whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Only staff can manage whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Only staff can view whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages editable by admins" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "WhatsApp messages viewable by admins" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "messages_admin_manage_v4" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "v16_wa_messages_delete" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "v16_wa_messages_insert" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "v16_wa_messages_select" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "v16_wa_messages_update" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "wa_messages_select_admin" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_all" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_v18" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_msg_manage" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_msg_secure" ON public.whatsapp_messages;

-- Criar policies consolidadas para whatsapp_messages
CREATE POLICY "whatsapp_messages_select_v17" ON public.whatsapp_messages
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text));

CREATE POLICY "whatsapp_messages_insert_v17" ON public.whatsapp_messages
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text));

CREATE POLICY "whatsapp_messages_update_v17" ON public.whatsapp_messages
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text))
WITH CHECK (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'suporte'::text));

CREATE POLICY "whatsapp_messages_delete_v17" ON public.whatsapp_messages
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- CONSOLIDAR: entradas (remover duplicatas)
-- =====================================================

DROP POLICY IF EXISTS "Financial can manage entradas" ON public.entradas;
DROP POLICY IF EXISTS "entradas_delete_financial" ON public.entradas;
DROP POLICY IF EXISTS "entradas_delete_owner" ON public.entradas;
DROP POLICY IF EXISTS "entradas_financial_v18" ON public.entradas;
DROP POLICY IF EXISTS "entradas_insert_finance" ON public.entradas;
DROP POLICY IF EXISTS "entradas_insert_financial" ON public.entradas;
DROP POLICY IF EXISTS "entradas_select_finance" ON public.entradas;
DROP POLICY IF EXISTS "entradas_select_financial" ON public.entradas;
DROP POLICY IF EXISTS "entradas_update_finance" ON public.entradas;
DROP POLICY IF EXISTS "entradas_update_financial" ON public.entradas;

-- Manter: Service role full access entradas, entradas_service_insert

-- Criar policies consolidadas para entradas
CREATE POLICY "entradas_select_v17" ON public.entradas
FOR SELECT TO authenticated
USING (can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "entradas_insert_v17" ON public.entradas
FOR INSERT TO authenticated
WITH CHECK (can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "entradas_update_v17" ON public.entradas
FOR UPDATE TO authenticated
USING (can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK (can_view_financial(auth.uid()) OR is_admin_or_owner(auth.uid()));

CREATE POLICY "entradas_delete_v17" ON public.entradas
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- CONSOLIDAR: woocommerce_orders (remover duplicatas)
-- =====================================================

DROP POLICY IF EXISTS "Only admin/owner can manage woocommerce_orders" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "Only admin/owner can view woocommerce_orders" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_delete_owner_only" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_insert_admin" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_insert_owner_only" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_select_admin" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_select_admin_owner" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_update_admin" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_update_owner_only" ON public.woocommerce_orders;

-- Criar policies consolidadas para woocommerce_orders
CREATE POLICY "woo_orders_select_v17" ON public.woocommerce_orders
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "woo_orders_insert_v17" ON public.woocommerce_orders
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "woo_orders_update_v17" ON public.woocommerce_orders
FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "woo_orders_delete_v17" ON public.woocommerce_orders
FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- =====================================================
-- REGISTRO DE HARDENING PARTE 3
-- =====================================================

INSERT INTO public.audit_logs (action, table_name, metadata, created_at)
VALUES (
  'SECURITY_HARDENING_v17.2',
  'system',
  jsonb_build_object(
    'version', '17.2',
    'date', '2025-12-25',
    'changes', jsonb_build_array(
      'Fixed whatsapp_messages WITH CHECK true policies (2)',
      'Consolidated whatsapp_messages policies (17 -> 5)',
      'Consolidated entradas policies (12 -> 6)',
      'Consolidated woocommerce_orders policies (9 -> 4)'
    ),
    'owner', 'moisesblank@gmail.com'
  ),
  now()
);