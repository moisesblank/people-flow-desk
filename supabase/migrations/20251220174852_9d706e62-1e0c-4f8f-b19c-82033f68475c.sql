-- ============================================
-- ENTERPRISE FINANCE VAULT v2300
-- Otimizações para 5000+ Usuários Simultâneos
-- Índices de Performance Avançados
-- ============================================

-- Enable Realtime for remaining finance tables
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments_monthly_closures';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments_yearly_closures';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.company_fixed_expenses';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.company_extra_expenses';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.company_monthly_closures';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.company_yearly_closures';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.entradas';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Full replica identity for real-time updates
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.payments_monthly_closures REPLICA IDENTITY FULL;
ALTER TABLE public.payments_yearly_closures REPLICA IDENTITY FULL;
ALTER TABLE public.company_fixed_expenses REPLICA IDENTITY FULL;
ALTER TABLE public.company_extra_expenses REPLICA IDENTITY FULL;
ALTER TABLE public.company_monthly_closures REPLICA IDENTITY FULL;
ALTER TABLE public.company_yearly_closures REPLICA IDENTITY FULL;
ALTER TABLE public.entradas REPLICA IDENTITY FULL;

-- Additional indexes for company_fixed_expenses (performance)
CREATE INDEX IF NOT EXISTS idx_company_fixed_expenses_categoria ON public.company_fixed_expenses(categoria);
CREATE INDEX IF NOT EXISTS idx_company_fixed_expenses_created_at ON public.company_fixed_expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_fixed_expenses_ano_mes ON public.company_fixed_expenses(ano, mes);
CREATE INDEX IF NOT EXISTS idx_company_fixed_expenses_fechado ON public.company_fixed_expenses(fechado);

-- Additional indexes for company_extra_expenses (performance)
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_categoria ON public.company_extra_expenses(categoria);
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_created_at ON public.company_extra_expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_ano_mes ON public.company_extra_expenses(ano, mes);
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_fechado ON public.company_extra_expenses(fechado);
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_data ON public.company_extra_expenses(data DESC);

-- Indexes for payments table (performance)
CREATE INDEX IF NOT EXISTS idx_payments_tipo ON public.payments(tipo);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_data_pagamento ON public.payments(data_pagamento);

-- Indexes for entradas table (performance) - usando colunas corretas
CREATE INDEX IF NOT EXISTS idx_entradas_data ON public.entradas(data DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_categoria ON public.entradas(categoria);
CREATE INDEX IF NOT EXISTS idx_entradas_fonte ON public.entradas(fonte);
CREATE INDEX IF NOT EXISTS idx_entradas_created_at ON public.entradas(created_at DESC);

-- Indexes for closures tables (performance)
CREATE INDEX IF NOT EXISTS idx_payments_monthly_closures_ano_mes ON public.payments_monthly_closures(ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_payments_yearly_closures_ano ON public.payments_yearly_closures(ano DESC);
CREATE INDEX IF NOT EXISTS idx_company_monthly_closures_ano_mes ON public.company_monthly_closures(ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_company_yearly_closures_ano ON public.company_yearly_closures(ano DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_status_data ON public.payments(status, data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_company_fixed_status_venc ON public.company_fixed_expenses(status_pagamento, data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_company_extra_status_venc ON public.company_extra_expenses(status_pagamento, data_vencimento DESC);