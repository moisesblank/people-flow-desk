-- ============================================
-- GOOGLE ANALYTICS + WOOCOMMERCE INTEGRATION
-- Tabelas para métricas em tempo real
-- ============================================

-- Tabela para métricas do Google Analytics
CREATE TABLE IF NOT EXISTS public.google_analytics_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  pages_per_session DECIMAL(10,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- em segundos
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  organic_search INTEGER DEFAULT 0,
  direct INTEGER DEFAULT 0,
  social INTEGER DEFAULT 0,
  referral INTEGER DEFAULT 0,
  paid_search INTEGER DEFAULT 0,
  top_pages JSONB DEFAULT '[]'::jsonb,
  devices JSONB DEFAULT '[]'::jsonb,
  locations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Tabela para vendas WooCommerce
CREATE TABLE IF NOT EXISTS public.woocommerce_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL UNIQUE,
  order_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  currency VARCHAR(10) DEFAULT 'BRL',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_total DECIMAL(12,2) DEFAULT 0,
  shipping_total DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(100),
  payment_method_title VARCHAR(200),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_country VARCHAR(100),
  items_count INTEGER DEFAULT 0,
  products JSONB DEFAULT '[]'::jsonb,
  date_created TIMESTAMPTZ DEFAULT NOW(),
  date_paid TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para métricas diárias WooCommerce
CREATE TABLE IF NOT EXISTS public.woocommerce_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_order_value DECIMAL(12,2) DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  abandoned_carts INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  top_products JSONB DEFAULT '[]'::jsonb,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.google_analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (apenas autenticados podem ler, admin pode escrever)
CREATE POLICY "Authenticated users can view analytics"
  ON public.google_analytics_metrics FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin can manage analytics"
  ON public.google_analytics_metrics FOR ALL
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can view orders"
  ON public.woocommerce_orders FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin can manage orders"
  ON public.woocommerce_orders FOR ALL
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can view woo metrics"
  ON public.woocommerce_daily_metrics FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin can manage woo metrics"
  ON public.woocommerce_daily_metrics FOR ALL
  USING (public.is_admin_or_owner(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_analytics_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.woocommerce_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.woocommerce_daily_metrics;

-- Triggers para updated_at
CREATE TRIGGER update_google_analytics_timestamp
  BEFORE UPDATE ON public.google_analytics_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_woocommerce_orders_timestamp
  BEFORE UPDATE ON public.woocommerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_woocommerce_daily_metrics_timestamp
  BEFORE UPDATE ON public.woocommerce_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();