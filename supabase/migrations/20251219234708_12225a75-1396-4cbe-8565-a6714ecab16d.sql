
-- ============================================
-- MARKETING AUTOMATIONS - TABELAS E REALTIME
-- ============================================

-- Tabela de Leads de Marketing
CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT,
  telefone TEXT,
  origem TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  canal TEXT,
  campanha_id UUID REFERENCES public.marketing_campaigns(id),
  status TEXT DEFAULT 'novo',
  score INTEGER DEFAULT 0,
  convertido BOOLEAN DEFAULT false,
  data_conversao TIMESTAMPTZ,
  valor_conversao NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Alertas de Marketing
CREATE TABLE IF NOT EXISTS public.marketing_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  severidade TEXT DEFAULT 'info',
  dados JSONB DEFAULT '{}',
  lido BOOLEAN DEFAULT false,
  resolvido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON public.marketing_leads(email);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON public.marketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created ON public.marketing_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_alerts_tipo ON public.marketing_alerts(tipo);
CREATE INDEX IF NOT EXISTS idx_marketing_alerts_lido ON public.marketing_alerts(lido);

-- Enable RLS
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_alerts ENABLE ROW LEVEL SECURITY;

-- Policies (Admin/Owner acesso total)
CREATE POLICY "Admin acesso total leads" ON public.marketing_leads FOR ALL USING (true);
CREATE POLICY "Admin acesso total alerts" ON public.marketing_alerts FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_campaigns;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_marketing_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketing_leads_updated
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION update_marketing_leads_updated_at();
