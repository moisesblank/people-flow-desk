-- ============================================
-- SYSTEM REALTIME LOGS v1.0
-- Tabela unificada para logs em tempo real
-- ============================================

-- Criar tabela de logs em tempo real
CREATE TABLE IF NOT EXISTS public.system_realtime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL DEFAULT 'general',
  source TEXT NOT NULL DEFAULT 'frontend',
  affected_url TEXT,
  triggered_action TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  device_info TEXT,
  ip_hash TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_realtime_logs_timestamp ON public.system_realtime_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_realtime_logs_severity ON public.system_realtime_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_realtime_logs_category ON public.system_realtime_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_realtime_logs_created_at ON public.system_realtime_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.system_realtime_logs ENABLE ROW LEVEL SECURITY;

-- Política: Owner pode ver TODOS os logs
CREATE POLICY "Owner can view all logs"
ON public.system_realtime_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Política: Admin pode ver logs (exceto críticos de segurança)
CREATE POLICY "Admin can view non-critical logs"
ON public.system_realtime_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  AND category != 'security_internal'
);

-- Política: Sistema pode inserir logs (qualquer usuário autenticado ou anônimo)
CREATE POLICY "System can insert logs"
ON public.system_realtime_logs
FOR INSERT
WITH CHECK (true);

-- Política: Owner pode marcar como resolvido
CREATE POLICY "Owner can update logs"
ON public.system_realtime_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_realtime_logs;

-- Função para inserir log de forma segura (chamável pelo frontend)
CREATE OR REPLACE FUNCTION public.insert_system_log(
  p_severity TEXT,
  p_category TEXT,
  p_source TEXT,
  p_affected_url TEXT,
  p_triggered_action TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_session_id TEXT DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
BEGIN
  -- Obter dados do usuário atual se autenticado
  SELECT 
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
  INTO v_user_email, v_user_role;

  INSERT INTO public.system_realtime_logs (
    severity,
    category,
    source,
    affected_url,
    triggered_action,
    error_message,
    stack_trace,
    user_id,
    user_email,
    user_role,
    metadata,
    session_id,
    device_info
  ) VALUES (
    p_severity,
    p_category,
    p_source,
    p_affected_url,
    p_triggered_action,
    p_error_message,
    p_stack_trace,
    auth.uid(),
    v_user_email,
    v_user_role,
    p_metadata,
    p_session_id,
    p_device_info
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Comentário na tabela
COMMENT ON TABLE public.system_realtime_logs IS 'Logs em tempo real para monitoramento do sistema - visível ao owner via /gestaofc/logs';