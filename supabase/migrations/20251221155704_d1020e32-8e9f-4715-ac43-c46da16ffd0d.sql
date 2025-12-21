-- ============================================
-- 🔥 DOGMA IX: LOGS DE AUDITORIA COMPLETOS
-- Triggers para ações críticas
-- ============================================

-- ============================================
-- FUNÇÃO GENÉRICA DE AUDITORIA
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_action TEXT;
BEGIN
  -- Determinar ação
  IF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  END IF;
  
  -- Inserir log de auditoria
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    v_action || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
      ELSE NEW.id::TEXT
    END,
    v_old_data,
    v_new_data,
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    ),
    NOW()
  );
  
  -- Retornar registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================
-- TRIGGERS PARA TABELAS CRÍTICAS
-- ============================================

-- 1. Profiles (alterações de usuário)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 2. User Roles (alterações de permissão - CRÍTICO)
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 3. Alunos (dados de clientes)
DROP TRIGGER IF EXISTS audit_alunos ON public.alunos;
CREATE TRIGGER audit_alunos
  AFTER INSERT OR UPDATE OR DELETE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 4. Transações Hotmart (vendas)
DROP TRIGGER IF EXISTS audit_transacoes_hotmart ON public.transacoes_hotmart_completo;
CREATE TRIGGER audit_transacoes_hotmart
  AFTER INSERT OR UPDATE OR DELETE ON public.transacoes_hotmart_completo
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 5. Comissões (dinheiro)
DROP TRIGGER IF EXISTS audit_comissoes ON public.comissoes;
CREATE TRIGGER audit_comissoes
  AFTER INSERT OR UPDATE OR DELETE ON public.comissoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 6. Entradas (receitas)
DROP TRIGGER IF EXISTS audit_entradas ON public.entradas;
CREATE TRIGGER audit_entradas
  AFTER INSERT OR UPDATE OR DELETE ON public.entradas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 7. Contas a Pagar
DROP TRIGGER IF EXISTS audit_contas_pagar ON public.contas_pagar;
CREATE TRIGGER audit_contas_pagar
  AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 8. Employees (funcionários)
DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 9. Affiliates (afiliados)
DROP TRIGGER IF EXISTS audit_affiliates ON public.affiliates;
CREATE TRIGGER audit_affiliates
  AFTER INSERT OR UPDATE OR DELETE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- 10. User Sessions (logins)
DROP TRIGGER IF EXISTS audit_user_sessions ON public.user_sessions;
CREATE TRIGGER audit_user_sessions
  AFTER INSERT OR UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- ============================================
-- FUNÇÃO PARA LOG DE ACESSO A RELATÓRIOS
-- ============================================
CREATE OR REPLACE FUNCTION public.log_report_access(
  p_report_type TEXT,
  p_report_params JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    'REPORT_ACCESS_' || UPPER(p_report_type),
    'reports',
    jsonb_build_object(
      'report_type', p_report_type,
      'params', p_report_params,
      'accessed_at', NOW()
    ),
    NOW()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================
-- ÍNDICES PARA PERFORMANCE DE AUDITORIA
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);

-- ============================================
-- FUNÇÃO PARA CONSULTA DE AUDITORIA (OWNER ONLY)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_table_name TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_from_date TIMESTAMP DEFAULT NULL,
  p_to_date TIMESTAMP DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas owner pode consultar logs
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Acesso negado: apenas o OWNER pode consultar logs de auditoria';
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    COALESCE(p.email, 'sistema') as user_email,
    a.action,
    a.table_name,
    a.record_id,
    a.old_data,
    a.new_data,
    a.metadata,
    a.created_at
  FROM public.audit_logs a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE 
    (p_table_name IS NULL OR a.table_name = p_table_name)
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_action IS NULL OR a.action ILIKE '%' || p_action || '%')
    AND (p_from_date IS NULL OR a.created_at >= p_from_date)
    AND (p_to_date IS NULL OR a.created_at <= p_to_date)
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;