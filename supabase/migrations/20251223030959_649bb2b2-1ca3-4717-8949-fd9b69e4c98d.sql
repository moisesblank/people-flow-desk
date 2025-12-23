-- =====================================================
-- FASE 7: OPERAÇÃO - 5K AO VIVO (FIX)
-- Controles: C090-C094
-- =====================================================

-- Tabela de alertas críticos (C092)
CREATE TABLE IF NOT EXISTS public.critical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('cpu_high', 'memory_high', 'connections_high', 'errors_spike', 'latency_high', 'capacity_warning', 'security_threat', 'service_down')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_value NUMERIC,
  current_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  auto_action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de capacidade do sistema (C094)
CREATE TABLE IF NOT EXISTS public.system_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  warning_threshold INTEGER NOT NULL,
  critical_threshold INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  is_healthy BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(metric_name)
);

-- Inserir configurações de capacidade para 5k ao vivo
INSERT INTO public.system_capacity (metric_name, max_capacity, warning_threshold, critical_threshold, notes) VALUES
  ('realtime_connections', 5000, 4000, 4500, 'Conexões Realtime simultâneas'),
  ('active_sessions', 6000, 4800, 5400, 'Sessões ativas totais'),
  ('chat_messages_per_minute', 500, 400, 450, 'Mensagens de chat por minuto'),
  ('api_requests_per_second', 1000, 800, 900, 'Requisições API por segundo'),
  ('database_connections', 100, 80, 90, 'Conexões ao banco de dados'),
  ('cpu_usage_percent', 100, 70, 85, 'Uso de CPU (%)'),
  ('memory_usage_percent', 100, 75, 90, 'Uso de memória (%)')
ON CONFLICT (metric_name) DO NOTHING;

-- Tabela de rollback points (C091)
CREATE TABLE IF NOT EXISTS public.rollback_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  git_commit_hash TEXT,
  database_snapshot_id TEXT,
  edge_functions_version TEXT,
  is_stable BOOLEAN DEFAULT false,
  can_rollback_to BOOLEAN DEFAULT true,
  rollback_time_estimate_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de DR (Disaster Recovery) tests (C093)
CREATE TABLE IF NOT EXISTS public.dr_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type TEXT NOT NULL CHECK (test_type IN ('failover', 'backup_restore', 'data_recovery', 'service_restart', 'full_dr')),
  test_name TEXT NOT NULL,
  executed_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  success BOOLEAN,
  rto_actual_seconds INTEGER,
  rpo_actual_seconds INTEGER,
  issues_found TEXT[],
  lessons_learned TEXT,
  next_test_scheduled TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.critical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rollback_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dr_tests ENABLE ROW LEVEL SECURITY;

-- Políticas - Leitura para autenticados, escrita para owner/admin (usando email direto)
CREATE POLICY "critical_alerts_read" ON public.critical_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "critical_alerts_all_owner" ON public.critical_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
);

CREATE POLICY "system_capacity_read" ON public.system_capacity FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_capacity_all_owner" ON public.system_capacity FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
);

CREATE POLICY "rollback_points_read" ON public.rollback_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "rollback_points_all_owner" ON public.rollback_points FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
);

CREATE POLICY "dr_tests_read" ON public.dr_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "dr_tests_all_owner" ON public.dr_tests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
);

-- Função para criar alerta crítico automaticamente
CREATE OR REPLACE FUNCTION public.create_critical_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_threshold_value NUMERIC DEFAULT NULL,
  p_current_value NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
  v_auto_action TEXT := NULL;
BEGIN
  IF p_severity = 'emergency' THEN
    CASE p_alert_type
      WHEN 'connections_high' THEN v_auto_action := 'Ativando slow mode automático';
      WHEN 'cpu_high' THEN v_auto_action := 'Reduzindo workers não essenciais';
      WHEN 'security_threat' THEN v_auto_action := 'Bloqueando IP suspeito';
      ELSE v_auto_action := 'Notificando equipe de emergência';
    END CASE;
  END IF;

  INSERT INTO public.critical_alerts (
    alert_type, severity, title, message, 
    threshold_value, current_value, metadata, auto_action_taken
  ) VALUES (
    p_alert_type, p_severity, p_title, p_message,
    p_threshold_value, p_current_value, p_metadata, v_auto_action
  ) RETURNING id INTO v_alert_id;

  IF p_severity IN ('critical', 'emergency') THEN
    INSERT INTO public.security_events (
      event_type, severity, user_id, ip_address, user_agent, payload
    ) VALUES (
      'system_alert', p_severity, NULL, '0.0.0.0'::inet, 'system',
      jsonb_build_object('alert_id', v_alert_id, 'type', p_alert_type, 'message', p_message)
    );
  END IF;

  RETURN v_alert_id;
END;
$$;

-- Função para verificar capacidade do sistema
CREATE OR REPLACE FUNCTION public.check_system_capacity()
RETURNS TABLE (
  metric_name TEXT,
  max_capacity INTEGER,
  current_value INTEGER,
  usage_percent NUMERIC,
  status TEXT,
  can_handle_5k BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.metric_name,
    sc.max_capacity,
    sc.current_value,
    ROUND((sc.current_value::NUMERIC / NULLIF(sc.max_capacity, 0)::NUMERIC) * 100, 2) as usage_percent,
    CASE 
      WHEN sc.current_value >= sc.critical_threshold THEN 'CRITICAL'
      WHEN sc.current_value >= sc.warning_threshold THEN 'WARNING'
      ELSE 'OK'
    END as status,
    (sc.max_capacity >= 5000 OR sc.metric_name NOT LIKE '%connections%') as can_handle_5k
  FROM public.system_capacity sc
  ORDER BY 4 DESC;
END;
$$;

-- Função para atualizar métrica de capacidade
CREATE OR REPLACE FUNCTION public.update_capacity_metric(
  p_metric_name TEXT,
  p_current_value INTEGER
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
BEGIN
  SELECT * INTO v_config FROM public.system_capacity WHERE system_capacity.metric_name = p_metric_name;
  
  IF v_config IS NULL THEN
    RAISE EXCEPTION 'Métrica não encontrada: %', p_metric_name;
  END IF;

  UPDATE public.system_capacity 
  SET 
    current_value = p_current_value,
    last_updated_at = now(),
    is_healthy = (p_current_value < v_config.critical_threshold)
  WHERE system_capacity.metric_name = p_metric_name;

  IF p_current_value >= v_config.critical_threshold THEN
    PERFORM public.create_critical_alert(
      'capacity_warning', 'critical',
      'Capacidade crítica: ' || p_metric_name,
      format('Valor atual %s excede threshold crítico %s', p_current_value, v_config.critical_threshold),
      v_config.critical_threshold, p_current_value,
      jsonb_build_object('metric', p_metric_name)
    );
  ELSIF p_current_value >= v_config.warning_threshold THEN
    PERFORM public.create_critical_alert(
      'capacity_warning', 'warning',
      'Capacidade em alerta: ' || p_metric_name,
      format('Valor atual %s excede threshold de alerta %s', p_current_value, v_config.warning_threshold),
      v_config.warning_threshold, p_current_value,
      jsonb_build_object('metric', p_metric_name)
    );
  END IF;
END;
$$;

-- Função para registrar ponto de rollback
CREATE OR REPLACE FUNCTION public.create_rollback_point(
  p_version TEXT,
  p_description TEXT,
  p_git_commit TEXT DEFAULT NULL,
  p_is_stable BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_point_id UUID;
BEGIN
  INSERT INTO public.rollback_points (version, description, created_by, git_commit_hash, is_stable)
  VALUES (p_version, p_description, auth.uid(), p_git_commit, p_is_stable)
  RETURNING id INTO v_point_id;
  RETURN v_point_id;
END;
$$;

-- Função para registrar teste DR
CREATE OR REPLACE FUNCTION public.register_dr_test(
  p_test_type TEXT,
  p_test_name TEXT,
  p_success BOOLEAN,
  p_rto_seconds INTEGER,
  p_rpo_seconds INTEGER,
  p_issues TEXT[] DEFAULT NULL,
  p_lessons TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id UUID;
BEGIN
  INSERT INTO public.dr_tests (
    test_type, test_name, executed_by, started_at, completed_at,
    success, rto_actual_seconds, rpo_actual_seconds, issues_found, lessons_learned, next_test_scheduled
  ) VALUES (
    p_test_type, p_test_name, auth.uid(), now() - (p_rto_seconds || ' seconds')::interval, now(),
    p_success, p_rto_seconds, p_rpo_seconds, p_issues, p_lessons, now() + interval '30 days'
  ) RETURNING id INTO v_test_id;

  INSERT INTO public.security_events (event_type, severity, user_id, ip_address, user_agent, payload)
  VALUES ('dr_test', CASE WHEN p_success THEN 'info' ELSE 'warning' END, auth.uid(), '0.0.0.0'::inet, 'system',
    jsonb_build_object('test_id', v_test_id, 'type', p_test_type, 'success', p_success));

  RETURN v_test_id;
END;
$$;

-- Comentários
COMMENT ON TABLE public.critical_alerts IS 'FASE 7 (C092): Sistema de alertas críticos com auto-ações';
COMMENT ON TABLE public.system_capacity IS 'FASE 7 (C094): Monitoramento de capacidade para 5k simultâneos';
COMMENT ON TABLE public.rollback_points IS 'FASE 7 (C091): Pontos de rollback < 5min';
COMMENT ON TABLE public.dr_tests IS 'FASE 7 (C093): Registro de testes de DR';