-- ================================================================
-- MEGA SECURITY UPGRADE v1.1 - Correção
-- ================================================================

-- Drop políticas que podem já existir
DROP POLICY IF EXISTS "affiliates_delete_owner_only" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_select_secure" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_insert_owner_admin" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_update_owner_admin" ON public.affiliates;

-- Recriar políticas de affiliates
CREATE POLICY "affiliates_select_secure" ON public.affiliates
FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR email = public.current_user_email()
  OR user_id = auth.uid()
);

CREATE POLICY "affiliates_insert_owner_admin" ON public.affiliates
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "affiliates_update_owner_admin" ON public.affiliates
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "affiliates_delete_owner_only" ON public.affiliates
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 3. EMPLOYEES - RH/Admin veem, funcionário vê só seu
-- ==============================================
DROP POLICY IF EXISTS "employees_select_secure" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_admin" ON public.employees;
DROP POLICY IF EXISTS "employees_update_admin" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_owner" ON public.employees;

CREATE POLICY "employees_select_secure" ON public.employees
FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR user_id = auth.uid()
  OR email = public.current_user_email()
);

CREATE POLICY "employees_insert_admin" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "employees_update_admin" ON public.employees
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "employees_delete_owner" ON public.employees
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 4. TRANSACOES HOTMART - Apenas Owner/Admin
-- ==============================================
DROP POLICY IF EXISTS "transacoes_select_owner_admin" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_insert_system" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_update_admin" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_delete_owner" ON public.transacoes_hotmart_completo;

CREATE POLICY "transacoes_select_owner_admin" ON public.transacoes_hotmart_completo
FOR SELECT TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "transacoes_insert_system" ON public.transacoes_hotmart_completo
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "transacoes_update_admin" ON public.transacoes_hotmart_completo
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "transacoes_delete_owner" ON public.transacoes_hotmart_completo
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 5. USUARIOS WORDPRESS SYNC - Apenas Owner
-- ==============================================
DROP POLICY IF EXISTS "wp_users_select_owner" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_insert_owner" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_update_owner" ON public.usuarios_wordpress_sync;
DROP POLICY IF EXISTS "wp_users_delete_owner" ON public.usuarios_wordpress_sync;

CREATE POLICY "wp_users_select_owner" ON public.usuarios_wordpress_sync
FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "wp_users_insert_owner" ON public.usuarios_wordpress_sync
FOR INSERT TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "wp_users_update_owner" ON public.usuarios_wordpress_sync
FOR UPDATE TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "wp_users_delete_owner" ON public.usuarios_wordpress_sync
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 6. WHATSAPP LEADS - Marketing + Admin
-- ==============================================
DROP POLICY IF EXISTS "whatsapp_leads_select_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_insert_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_update_secure" ON public.whatsapp_leads;
DROP POLICY IF EXISTS "whatsapp_leads_delete_owner" ON public.whatsapp_leads;

CREATE POLICY "whatsapp_leads_select_secure" ON public.whatsapp_leads
FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'marketing')
);

CREATE POLICY "whatsapp_leads_insert_secure" ON public.whatsapp_leads
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'marketing')
);

CREATE POLICY "whatsapp_leads_update_secure" ON public.whatsapp_leads
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "whatsapp_leads_delete_owner" ON public.whatsapp_leads
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- ==============================================
-- 7. PROFILES - Usuário vê apenas seu próprio, Owner vê todos
-- ==============================================
DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_secure" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR public.is_owner(auth.uid())
);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ==============================================
-- 8. TWO FACTOR CODES - Apenas próprio usuário
-- ==============================================
DROP POLICY IF EXISTS "2fa_select_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_insert_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_update_own" ON public.two_factor_codes;
DROP POLICY IF EXISTS "2fa_delete_own" ON public.two_factor_codes;

CREATE POLICY "2fa_select_own" ON public.two_factor_codes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "2fa_insert_own" ON public.two_factor_codes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "2fa_update_own" ON public.two_factor_codes
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "2fa_delete_own" ON public.two_factor_codes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ==============================================
-- 9. WOOCOMMERCE ORDERS - Apenas Owner/Admin
-- ==============================================
DROP POLICY IF EXISTS "woo_orders_select_admin" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_insert_admin" ON public.woocommerce_orders;
DROP POLICY IF EXISTS "woo_orders_update_admin" ON public.woocommerce_orders;

CREATE POLICY "woo_orders_select_admin" ON public.woocommerce_orders
FOR SELECT TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "woo_orders_insert_admin" ON public.woocommerce_orders
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "woo_orders_update_admin" ON public.woocommerce_orders
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ==============================================
-- 10. MARKETING LEADS - Marketing + Admin
-- ==============================================
DROP POLICY IF EXISTS "marketing_leads_select_secure" ON public.marketing_leads;
DROP POLICY IF EXISTS "marketing_leads_insert_secure" ON public.marketing_leads;
DROP POLICY IF EXISTS "marketing_leads_update_admin" ON public.marketing_leads;
DROP POLICY IF EXISTS "marketing_leads_delete_owner" ON public.marketing_leads;

CREATE POLICY "marketing_leads_select_secure" ON public.marketing_leads
FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'marketing')
);

CREATE POLICY "marketing_leads_insert_secure" ON public.marketing_leads
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  OR public.has_role(auth.uid(), 'marketing')
);

CREATE POLICY "marketing_leads_update_admin" ON public.marketing_leads
FOR UPDATE TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "marketing_leads_delete_owner" ON public.marketing_leads
FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));