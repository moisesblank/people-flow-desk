
-- =====================================================
-- MOISÉS MEDEIROS v5.0 - SECURITY FIX
-- Fix views to use security invoker
-- =====================================================

-- Drop and recreate employees_safe with security_invoker
DROP VIEW IF EXISTS employees_safe;
CREATE VIEW employees_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  status,
  email,
  telefone,
  data_admissao,
  horario_trabalho,
  responsabilidades,
  created_at,
  updated_at,
  user_id,
  created_by,
  get_masked_salary(salario::numeric, user_id) AS salario
FROM employees e;

-- Drop and recreate profiles_public with security_invoker
DROP VIEW IF EXISTS profiles_public;
CREATE VIEW profiles_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  avatar_url
FROM profiles;

-- Grant access to authenticated users
GRANT SELECT ON employees_safe TO authenticated;
GRANT SELECT ON profiles_public TO authenticated;
