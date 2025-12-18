-- ==========================================================
-- SECURITY FIX v17.1: Corrigir 5 erros de segurança críticos
-- Usar is_owner() e has_role() existentes
-- ==========================================================

-- ============================================
-- 1. EMPLOYEE_COMPENSATION - Salários somente owner
-- ============================================

DROP POLICY IF EXISTS "Owner can manage employee compensation" ON employee_compensation;
DROP POLICY IF EXISTS "Employees can view own compensation" ON employee_compensation;
DROP POLICY IF EXISTS "employee_compensation_select" ON employee_compensation;
DROP POLICY IF EXISTS "employee_compensation_insert" ON employee_compensation;
DROP POLICY IF EXISTS "employee_compensation_update" ON employee_compensation;
DROP POLICY IF EXISTS "employee_compensation_delete" ON employee_compensation;

CREATE POLICY "Only owner can view all compensation"
ON employee_compensation FOR SELECT
TO authenticated
USING (is_owner());

CREATE POLICY "Only owner can insert compensation"
ON employee_compensation FOR INSERT
TO authenticated
WITH CHECK (is_owner());

CREATE POLICY "Only owner can update compensation"
ON employee_compensation FOR UPDATE
TO authenticated
USING (is_owner());

CREATE POLICY "Only owner can delete compensation"
ON employee_compensation FOR DELETE
TO authenticated
USING (is_owner());

-- ============================================
-- 2. FINANCIAL METRICS - owner/admin apenas
-- ============================================

-- metricas_marketing
DROP POLICY IF EXISTS "Anyone can read marketing metrics" ON metricas_marketing;
DROP POLICY IF EXISTS "Marketing can manage metrics" ON metricas_marketing;
DROP POLICY IF EXISTS "Owner can manage marketing metrics" ON metricas_marketing;
DROP POLICY IF EXISTS "Only owner can view marketing metrics" ON metricas_marketing;
DROP POLICY IF EXISTS "Only owner can manage marketing metrics" ON metricas_marketing;

CREATE POLICY "Owner/admin can view marketing metrics"
ON metricas_marketing FOR SELECT
TO authenticated
USING (is_owner() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage marketing metrics"
ON metricas_marketing FOR ALL
TO authenticated
USING (is_owner());

-- metricas_diarias
DROP POLICY IF EXISTS "Anyone can read daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Admin can manage daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Owner can manage daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Only owner/admin can view daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Only owner can manage daily metrics" ON metricas_diarias;

CREATE POLICY "Owner/admin can view daily metrics"
ON metricas_diarias FOR SELECT
TO authenticated
USING (is_owner() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage daily metrics"
ON metricas_diarias FOR ALL
TO authenticated
USING (is_owner());

-- ============================================
-- 3. ALUNOS - Restringir PII a owner/admin
-- ============================================

DROP POLICY IF EXISTS "Coordenacao can view all students" ON alunos;
DROP POLICY IF EXISTS "Owner can view all students" ON alunos;
DROP POLICY IF EXISTS "alunos_select_policy" ON alunos;
DROP POLICY IF EXISTS "alunos_insert_policy" ON alunos;
DROP POLICY IF EXISTS "alunos_update_policy" ON alunos;
DROP POLICY IF EXISTS "alunos_delete_policy" ON alunos;
DROP POLICY IF EXISTS "Only owner/admin can view all students" ON alunos;
DROP POLICY IF EXISTS "Only owner can manage students" ON alunos;

CREATE POLICY "Owner/admin can view all students"
ON alunos FOR SELECT
TO authenticated
USING (is_owner() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage students"
ON alunos FOR ALL
TO authenticated
USING (is_owner());

-- ============================================
-- 4. AFFILIATES - Dados bancários somente owner
-- ============================================

DROP POLICY IF EXISTS "Affiliates can view own data" ON affiliates;
DROP POLICY IF EXISTS "Owner can view all affiliates" ON affiliates;
DROP POLICY IF EXISTS "affiliates_select" ON affiliates;
DROP POLICY IF EXISTS "affiliates_insert" ON affiliates;
DROP POLICY IF EXISTS "affiliates_update" ON affiliates;
DROP POLICY IF EXISTS "affiliates_delete" ON affiliates;
DROP POLICY IF EXISTS "Only owner can view all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Only owner can manage affiliates" ON affiliates;

CREATE POLICY "Owner can view all affiliates"
ON affiliates FOR SELECT
TO authenticated
USING (is_owner());

CREATE POLICY "Affiliate can view own data"
ON affiliates FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can manage affiliates"
ON affiliates FOR ALL
TO authenticated
USING (is_owner());

-- ============================================
-- 5. TRANSACOES_HOTMART_COMPLETO - CPF/PII somente owner
-- ============================================

DROP POLICY IF EXISTS "Admin can view hotmart transactions" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "Owner can view hotmart transactions" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_completo_select" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_completo_insert" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_completo_update" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_completo_delete" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "Only owner can view hotmart transactions" ON transacoes_hotmart_completo;
DROP POLICY IF EXISTS "Only owner can manage hotmart transactions" ON transacoes_hotmart_completo;

CREATE POLICY "Owner can view hotmart transactions"
ON transacoes_hotmart_completo FOR SELECT
TO authenticated
USING (is_owner());

CREATE POLICY "Owner can manage hotmart transactions"
ON transacoes_hotmart_completo FOR ALL
TO authenticated
USING (is_owner());