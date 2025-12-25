-- ============================================
-- MIGRATION v17.3: CONSOLIDAR user_roles + user_mfa_settings
-- Remover duplicatas e padronizar
-- ============================================

-- ========== USER_ROLES (9 → 4 políticas) ==========
DROP POLICY IF EXISTS "Owner can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner manages user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner manages user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_owner" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_owner" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_owner" ON public.user_roles;

-- Políticas consolidadas usando is_owner()
CREATE POLICY "user_roles_select"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "user_roles_insert"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "user_roles_update"
ON public.user_roles FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "user_roles_delete"
ON public.user_roles FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- ========== USER_MFA_SETTINGS (verificar e limpar duplicatas) ==========
DROP POLICY IF EXISTS "mfa_delete_own" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "mfa_insert_own" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "mfa_select_own" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "mfa_update_own" ON public.user_mfa_settings;

-- Recriar com padrão correto (usuário gerencia próprio MFA + owner vê tudo)
CREATE POLICY "mfa_select"
ON public.user_mfa_settings FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "mfa_insert"
ON public.user_mfa_settings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "mfa_update"
ON public.user_mfa_settings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "mfa_delete"
ON public.user_mfa_settings FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR is_owner(auth.uid()));

-- ========== GRANT EXPLÍCITO para evitar "permission denied" ==========
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mfa_settings TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;