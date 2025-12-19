-- =====================================================
-- MASTER PRO ULTRA v3.0 - OTIMIZAÇÃO PARA 5.000+ USUÁRIOS
-- Seguindo DIRETRIZ-MÃE: PRESERVAR → MELHORAR → ESCALAR
-- =====================================================

-- 1. ÍNDICES PARA QUERIES FREQUENTES (sem CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_alunos_status_ativo 
ON alunos(status) WHERE status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_alunos_email 
ON alunos(email);

CREATE INDEX IF NOT EXISTS idx_alunos_created_at 
ON alunos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_entradas_data_categoria 
ON entradas(data DESC, categoria);

CREATE INDEX IF NOT EXISTS idx_entradas_created_at 
ON entradas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento 
ON contas_pagar(data_vencimento, status);

CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento 
ON contas_receber(data_vencimento, status);

CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date_user 
ON calendar_tasks(task_date, user_id);

CREATE INDEX IF NOT EXISTS idx_hotmart_status_data 
ON transacoes_hotmart_completo(status, data_compra DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_status_created 
ON webhooks_queue(status, created_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_employees_status 
ON employees(status) WHERE status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created 
ON activity_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
ON user_sessions(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_profiles_online 
ON profiles(is_online, last_activity_at DESC) WHERE is_online = true;

-- 2. TABELA PARA RATE LIMITING AVANÇADO
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only api_rate_limits" ON api_rate_limits;
CREATE POLICY "Service role only api_rate_limits" ON api_rate_limits
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
ON api_rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_client_endpoint 
ON api_rate_limits(client_id, endpoint);

-- 3. FUNÇÃO DE CACHE PARA MÉTRICAS DASHBOARD
CREATE OR REPLACE FUNCTION get_cached_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'alunos_ativos', (SELECT COUNT(*) FROM alunos WHERE status = 'ativo'),
    'funcionarios_ativos', (SELECT COUNT(*) FROM employees WHERE status = 'ativo'),
    'afiliados_ativos', (SELECT COUNT(*) FROM affiliates WHERE status = 'ativo'),
    'receita_mes', (SELECT COALESCE(SUM(valor), 0) FROM entradas WHERE created_at >= date_trunc('month', now())),
    'despesa_mes', (SELECT COALESCE(SUM(valor), 0) FROM contas_pagar WHERE status = 'pago' AND data_pagamento >= date_trunc('month', now())),
    'vendas_mes', (SELECT COUNT(*) FROM transacoes_hotmart_completo WHERE status IN ('approved', 'purchase_approved') AND data_compra >= date_trunc('month', now())),
    'tarefas_hoje', (SELECT COUNT(*) FROM calendar_tasks WHERE task_date = CURRENT_DATE AND is_completed = false),
    'usuarios_online', (SELECT COUNT(*) FROM profiles WHERE is_online = true),
    'updated_at', now()
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- 4. FUNÇÃO DE RATE LIMITING
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_client_id text,
  p_endpoint text,
  p_limit integer DEFAULT 100,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM api_rate_limits
  WHERE client_id = p_client_id
    AND endpoint = p_endpoint
    AND window_start >= now() - (p_window_seconds || ' seconds')::interval;
  
  IF v_count >= p_limit THEN
    RETURN false;
  END IF;
  
  INSERT INTO api_rate_limits (client_id, endpoint)
  VALUES (p_client_id, p_endpoint);
  
  RETURN true;
END;
$$;

-- 5. FUNÇÃO DE LIMPEZA
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM api_rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$;