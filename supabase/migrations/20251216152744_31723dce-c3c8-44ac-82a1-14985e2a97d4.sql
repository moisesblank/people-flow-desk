-- =====================================================
-- MIGRAÇÃO: CAMPANHAS DE MARKETING DINÂMICAS
-- =====================================================

-- Tabela para campanhas de marketing
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'planejado' CHECK (status IN ('planejado', 'ativo', 'pausado', 'finalizado')),
  budget NUMERIC(12,2) DEFAULT 0,
  spent NUMERIC(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  platform TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para dados do funil de vendas
CREATE TABLE IF NOT EXISTS public.sales_funnel_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  reference_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_data ENABLE ROW LEVEL SECURITY;

-- Políticas para marketing_campaigns (apenas admin/owner pode ver)
CREATE POLICY "Admins can view marketing campaigns"
  ON public.marketing_campaigns FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can insert marketing campaigns"
  ON public.marketing_campaigns FOR INSERT
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update marketing campaigns"
  ON public.marketing_campaigns FOR UPDATE
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete marketing campaigns"
  ON public.marketing_campaigns FOR DELETE
  USING (public.is_admin_or_owner(auth.uid()));

-- Políticas para sales_funnel_data (apenas admin/owner pode ver)
CREATE POLICY "Admins can view sales funnel"
  ON public.sales_funnel_data FOR SELECT
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can manage sales funnel"
  ON public.sales_funnel_data FOR ALL
  USING (public.is_admin_or_owner(auth.uid()));

-- Inserir dados iniciais de campanhas
INSERT INTO public.marketing_campaigns (name, status, budget, spent, leads, conversions, platform) VALUES
('Lançamento ENEM 2025', 'ativo', 15000, 8500, 1250, 89, 'Google Ads'),
('Black Friday Química', 'planejado', 8000, 0, 0, 0, 'Instagram'),
('Remarketing Carrinho', 'ativo', 3000, 1800, 320, 45, 'Facebook');

-- Inserir dados iniciais do funil
INSERT INTO public.sales_funnel_data (stage, value, period) VALUES
('visitantes', 45000, 'monthly'),
('leads', 8500, 'monthly'),
('interessados', 2400, 'monthly'),
('carrinho', 890, 'monthly'),
('compras', 356, 'monthly');

-- Trigger para updated_at
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();