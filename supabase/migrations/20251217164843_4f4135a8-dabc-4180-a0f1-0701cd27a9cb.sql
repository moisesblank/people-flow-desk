-- =============================================
-- SECURITY HARDENING v15.0 - COMPLETO
-- =============================================

-- 1. Criar função para mascarar email
CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_at_pos INTEGER;
  v_masked TEXT;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;
  v_at_pos := position('@' in p_email);
  IF v_at_pos <= 3 THEN
    v_masked := '***' || substring(p_email from v_at_pos);
  ELSE
    v_masked := substring(p_email from 1 for 2) || '***' || substring(p_email from v_at_pos);
  END IF;
  RETURN v_masked;
END;
$$;

-- 2. Criar função para mascarar telefone
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_phone IS NULL OR length(p_phone) < 4 THEN
    RETURN '***';
  END IF;
  RETURN '***' || substring(p_phone from length(p_phone) - 3);
END;
$$;

-- 3. View segura de profiles
DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  CASE 
    WHEN public.is_owner(auth.uid()) OR auth.uid() = id THEN email
    ELSE public.mask_email(email)
  END as email,
  CASE 
    WHEN public.is_owner(auth.uid()) OR auth.uid() = id THEN phone
    ELSE public.mask_phone(phone)
  END as phone,
  avatar_url,
  is_online,
  bio,
  xp_total,
  level,
  streak_days,
  CASE 
    WHEN public.is_owner(auth.uid()) OR auth.uid() = id THEN last_login_at
    ELSE NULL
  END as last_login_at,
  CASE 
    WHEN public.is_owner(auth.uid()) OR auth.uid() = id THEN last_activity_at
    ELSE NULL
  END as last_activity_at,
  created_at
FROM public.profiles;

-- 4. View segura de funcionários
DROP VIEW IF EXISTS public.employees_safe CASCADE;

CREATE VIEW public.employees_safe 
WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.email,
  e.telefone,
  e.status,
  e.data_admissao,
  e.horario_trabalho,
  e.responsabilidades,
  CASE 
    WHEN public.is_owner(auth.uid()) THEN ec.salario
    ELSE NULL
  END as salario,
  e.created_at,
  e.updated_at
FROM public.employees e
LEFT JOIN public.employee_compensation ec ON e.id = ec.employee_id;

-- 5. View pública de funcionários
DROP VIEW IF EXISTS public.employees_public CASCADE;

CREATE VIEW public.employees_public
WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.horario_trabalho,
  e.created_at
FROM public.employees e
WHERE e.status = 'ativo';

-- 6. RLS para employee_compensation
DROP POLICY IF EXISTS "Owner can view all compensation" ON public.employee_compensation;
DROP POLICY IF EXISTS "Owner can manage compensation" ON public.employee_compensation;
DROP POLICY IF EXISTS "Owner only compensation access" ON public.employee_compensation;

CREATE POLICY "Owner only compensation access" 
ON public.employee_compensation 
FOR ALL 
TO authenticated 
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

-- 7. View de atividades recentes
DROP VIEW IF EXISTS public.owner_activity_summary CASCADE;

CREATE VIEW public.owner_activity_summary 
WITH (security_invoker = true) AS
SELECT 
  DATE(created_at) as data,
  action,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
  AND public.is_owner(auth.uid())
GROUP BY DATE(created_at), action
ORDER BY data DESC, total DESC;

-- 8. Índice para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive_access 
ON public.audit_logs (action) 
WHERE action LIKE 'SENSITIVE_DATA_%';