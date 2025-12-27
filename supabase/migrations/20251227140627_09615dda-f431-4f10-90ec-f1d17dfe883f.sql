-- CORREÇÃO: Políticas de employee_compensation muito restritivas
-- Admin/owner devem poder gerenciar salários, não apenas owner

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Only owner can insert compensation" ON employee_compensation;
DROP POLICY IF EXISTS "Only owner can update compensation" ON employee_compensation;
DROP POLICY IF EXISTS "Only owner can delete compensation" ON employee_compensation;
DROP POLICY IF EXISTS "Only owner can view all compensation" ON employee_compensation;
DROP POLICY IF EXISTS "Only owner can view compensation" ON employee_compensation;

-- 2. Criar novas políticas para admin_or_owner
CREATE POLICY "compensation_select_v18" ON employee_compensation
  FOR SELECT TO authenticated
  USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "compensation_insert_v18" ON employee_compensation
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "compensation_update_v18" ON employee_compensation
  FOR UPDATE TO authenticated
  USING (is_admin_or_owner(auth.uid()))
  WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "compensation_delete_v18" ON employee_compensation
  FOR DELETE TO authenticated
  USING (is_owner(auth.uid()));

-- 3. Garantir que service_role tem acesso total
CREATE POLICY "compensation_service_v18" ON employee_compensation
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);