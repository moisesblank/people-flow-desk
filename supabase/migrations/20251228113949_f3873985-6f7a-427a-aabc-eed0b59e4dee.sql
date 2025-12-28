-- ============================================
-- PATCH: Otimizar audit_logs - Retenção e Limpeza
-- PROBLEMA: 172k registros (333MB) em apenas 13 dias
-- CAUSA: Triggers em tabelas de alta frequência (profiles, user_sessions)
-- SOLUÇÃO: 
--   1. Desativar triggers em tabelas frequentes
--   2. Criar job de limpeza automática (30 dias)
--   3. Limpar registros repetitivos
-- ============================================

-- 1. DESATIVAR triggers de auditoria em tabelas de ALTA FREQUÊNCIA
-- Esses updates são esperados e não precisam de auditoria individual
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
DROP TRIGGER IF EXISTS audit_user_sessions ON user_sessions;

-- 2. CRIAR FUNÇÃO DE LIMPEZA AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Manter apenas logs dos últimos 30 dias
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO public.audit_logs (action, metadata, created_at)
  VALUES (
    'SYSTEM_CLEANUP',
    jsonb_build_object(
      'deleted_records', deleted_count,
      'retention_days', 30,
      'executed_at', NOW()
    ),
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

-- 3. LIMPAR IMEDIATAMENTE: Registros repetitivos que não agregam valor
-- Manter apenas 1 registro por hora para ações de alta frequência
DELETE FROM public.audit_logs
WHERE action IN ('FINANCIAL_UPDATE', 'UPDATE_profiles', 'UPDATE_user_sessions')
  AND id NOT IN (
    SELECT DISTINCT ON (DATE_TRUNC('hour', created_at), action, record_id) id
    FROM public.audit_logs
    WHERE action IN ('FINANCIAL_UPDATE', 'UPDATE_profiles', 'UPDATE_user_sessions')
    ORDER BY DATE_TRUNC('hour', created_at), action, record_id, created_at DESC
  );

-- 4. CRIAR ÍNDICE para melhorar performance de limpeza
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
ON public.audit_logs(action, created_at);

-- 5. VACUUM para recuperar espaço
-- (executado automaticamente pelo Postgres, mas comentando para referência)
-- VACUUM ANALYZE audit_logs;