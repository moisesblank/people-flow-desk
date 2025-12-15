-- ============================================
-- MOISÉS MEDEIROS v5.0 - OWNER-ONLY POLICIES
-- Migração para garantir edição exclusiva pelo Owner
-- ============================================

-- Drop existing policies that allow broad access and recreate with owner-only for critical operations

-- 1. EMPLOYEES - Apenas owner/admin pode gerenciar
DROP POLICY IF EXISTS "Admin can manage employees" ON public.employees;

CREATE POLICY "Owner/Admin can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 2. INCOME - Apenas owner/admin pode gerenciar receitas
DROP POLICY IF EXISTS "Admin manages income" ON public.income;

CREATE POLICY "Owner/Admin manages income"
ON public.income
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 3. COMPANY FIXED EXPENSES - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages company fixed expenses" ON public.company_fixed_expenses;

CREATE POLICY "Owner/Admin manages company fixed expenses"
ON public.company_fixed_expenses
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 4. COMPANY EXTRA EXPENSES - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages company extra expenses" ON public.company_extra_expenses;

CREATE POLICY "Owner/Admin manages company extra expenses"
ON public.company_extra_expenses
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 5. TAXES - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages taxes" ON public.taxes;

CREATE POLICY "Owner/Admin manages taxes"
ON public.taxes
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 6. AFFILIATES - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages affiliates" ON public.affiliates;

CREATE POLICY "Owner/Admin manages affiliates"
ON public.affiliates
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 7. SALES - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages sales" ON public.sales;

CREATE POLICY "Owner/Admin manages sales"
ON public.sales
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 8. STUDENTS - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages students" ON public.students;

CREATE POLICY "Owner/Admin manages students"
ON public.students
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 9. CONTABILIDADE - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages contabilidade" ON public.contabilidade;

CREATE POLICY "Owner/Admin manages contabilidade"
ON public.contabilidade
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 10. SYSTEM_SETTINGS - Apenas owner pode modificar
DROP POLICY IF EXISTS "Admin manages settings" ON public.system_settings;

CREATE POLICY "Owner manages system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
);

-- 11. USER_ROLES - Apenas owner pode gerenciar roles
DROP POLICY IF EXISTS "Owner manages roles" ON public.user_roles;

CREATE POLICY "Owner manages user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
);

-- Policy para permitir leitura do próprio role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 12. ANALYTICS_METRICS - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages analytics" ON public.analytics_metrics;

CREATE POLICY "Owner/Admin manages analytics"
ON public.analytics_metrics
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 13. METRICAS_MARKETING - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages marketing metrics" ON public.metricas_marketing;

CREATE POLICY "Owner/Admin manages marketing metrics"
ON public.metricas_marketing
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 14. CUSTOM_RULES - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages rules" ON public.custom_rules;

CREATE POLICY "Owner/Admin manages custom rules"
ON public.custom_rules
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 15. SYNAPSE_INTEGRATIONS - Apenas owner/admin
DROP POLICY IF EXISTS "Admin manages synapse integrations" ON public.synapse_integrations;

CREATE POLICY "Owner/Admin manages integrations"
ON public.synapse_integrations
FOR ALL
TO authenticated
USING (
  public.is_admin_or_owner(auth.uid())
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
);

-- 16. PERMISSION_AUDIT_LOGS - Apenas owner pode ver
DROP POLICY IF EXISTS "Owner views permission audit" ON public.permission_audit_logs;

CREATE POLICY "Owner views permission audit logs"
ON public.permission_audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
);

-- Insert policy para registrar mudanças (pelo sistema)
CREATE POLICY "Authenticated can insert audit logs"
ON public.permission_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);