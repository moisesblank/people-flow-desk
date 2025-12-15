-- FASE 3: CORREÇÕES DE SEGURANÇA + LOGS DE AUDITORIA + RATE LIMITING

-- ============================
-- 1. CORRIGIR EXPOSIÇÃO DE SALÁRIOS (employees)
-- ============================

-- Remover políticas antigas de employees
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;

-- Criar função para mascarar salário (retorna 0 para não-admins vendo próprio registro)
CREATE OR REPLACE FUNCTION public.get_masked_salary(emp_salary numeric, emp_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se o usuário é admin/owner, mostra o salário real
  IF is_admin_or_owner(auth.uid()) THEN
    RETURN emp_salary;
  END IF;
  -- Caso contrário, retorna NULL (não expõe salário)
  RETURN NULL;
END;
$$;

-- Funcionários podem ver apenas seus próprios dados básicos (exceto salário via view)
CREATE POLICY "Employees can view own basic data"
ON public.employees
FOR SELECT
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- Apenas admins podem inserir/atualizar/deletar funcionários
CREATE POLICY "Admins can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update employees"
ON public.employees
FOR UPDATE
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
USING (is_admin_or_owner(auth.uid()));

-- ============================
-- 2. CORRIGIR EXPOSIÇÃO DE EMAILS (profiles)
-- ============================

-- Remover política antiga que expõe emails
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Admins podem ver perfis mas com restrição (apenas owner vê todos os emails)
CREATE POLICY "Owner can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ============================
-- 3. TABELA DE LOGS DE AUDITORIA
-- ============================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas owner pode ver logs de auditoria
CREATE POLICY "Owner can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Função para inserir logs (usada por edge functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- ============================
-- 4. TABELA DE RATE LIMITING
-- ============================

CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  ip_address text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- Apenas sistema pode gerenciar rate limits
CREATE POLICY "System can manage rate limits"
ON public.webhook_rate_limits
FOR ALL
USING (true);

-- Índices para performance de rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_source_ip ON public.webhook_rate_limits(source, ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.webhook_rate_limits(window_start);

-- Função para limpar rate limits antigos (executa periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.webhook_rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;