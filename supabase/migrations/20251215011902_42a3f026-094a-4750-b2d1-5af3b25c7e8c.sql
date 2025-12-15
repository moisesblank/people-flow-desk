-- =====================================================
-- PROJETO SYNAPSE: SISTEMA NERVOSO DIGITAL
-- Arquitetura de Data Lakehouse para integrações
-- =====================================================

-- 1. Tabela de eventos de integração (Data Lakehouse)
CREATE TABLE public.integration_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  source text NOT NULL,
  source_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Index para buscar eventos por tipo e fonte
CREATE INDEX idx_integration_events_type ON public.integration_events (event_type);
CREATE INDEX idx_integration_events_source ON public.integration_events (source);
CREATE INDEX idx_integration_events_created ON public.integration_events (created_at DESC);

-- Enable RLS
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin manages integration events" 
ON public.integration_events 
FOR ALL 
USING (is_admin_or_owner(auth.uid()));

-- 2. Tabela de vendas/transações em tempo real (para Hotmart/Asaas)
CREATE TABLE public.synapse_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text UNIQUE,
  transaction_type text NOT NULL DEFAULT 'sale',
  source text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  customer_name text,
  customer_email text,
  product_name text,
  product_id text,
  affiliate_code text,
  metadata jsonb DEFAULT '{}'::jsonb,
  cnpj_origem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_synapse_transactions_source ON public.synapse_transactions (source);
CREATE INDEX idx_synapse_transactions_created ON public.synapse_transactions (created_at DESC);
CREATE INDEX idx_synapse_transactions_status ON public.synapse_transactions (status);

ALTER TABLE public.synapse_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages synapse transactions" 
ON public.synapse_transactions 
FOR ALL 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Synapse transactions select admin" 
ON public.synapse_transactions 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_synapse_transactions_updated_at
  BEFORE UPDATE ON public.synapse_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tabela de métricas em tempo real (widget do Synapse Pulse)
CREATE TABLE public.synapse_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metric_unit text DEFAULT 'count',
  category text NOT NULL DEFAULT 'general',
  period text DEFAULT 'daily',
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(metric_name, category, reference_date)
);

CREATE INDEX idx_synapse_metrics_name ON public.synapse_metrics (metric_name);
CREATE INDEX idx_synapse_metrics_category ON public.synapse_metrics (category);

ALTER TABLE public.synapse_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages synapse metrics" 
ON public.synapse_metrics 
FOR ALL 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Synapse metrics select admin" 
ON public.synapse_metrics 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_synapse_metrics_updated_at
  BEFORE UPDATE ON public.synapse_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Tabela de configurações de integrações
CREATE TABLE public.synapse_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  last_sync timestamptz,
  sync_status text DEFAULT 'never',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.synapse_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages synapse integrations" 
ON public.synapse_integrations 
FOR ALL 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Synapse integrations select admin" 
ON public.synapse_integrations 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- Trigger
CREATE TRIGGER update_synapse_integrations_updated_at
  BEFORE UPDATE ON public.synapse_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Inserir integrações padrão
INSERT INTO public.synapse_integrations (name, type, config) VALUES
  ('Hotmart', 'payment_gateway', '{"webhook_url": "/webhook-synapse", "events": ["purchase.approved", "purchase.refunded"]}'::jsonb),
  ('Asaas', 'payment_gateway', '{"webhook_url": "/webhook-synapse", "events": ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]}'::jsonb),
  ('Google Analytics', 'analytics', '{"property_id": "", "metrics": ["activeUsers", "pageViews"]}'::jsonb),
  ('YouTube', 'content', '{"channel_id": "", "metrics": ["views", "subscribers"]}'::jsonb),
  ('Google Calendar', 'productivity', '{"calendar_id": "primary"}'::jsonb),
  ('Make.com', 'automation', '{"webhook_url": "/webhook-synapse"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 6. Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.synapse_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.synapse_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_events;