-- ============================================
-- CENTRAL FINANÇAS EMPRESA - ESTILO SOFTCOM
-- Campos temporais + Fechamento mensal/anual
-- ============================================

-- Adicionar campos temporais a company_fixed_expenses
ALTER TABLE public.company_fixed_expenses
ADD COLUMN IF NOT EXISTS ano INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
ADD COLUMN IF NOT EXISTS mes INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
ADD COLUMN IF NOT EXISTS semana INTEGER DEFAULT EXTRACT(WEEK FROM NOW()),
ADD COLUMN IF NOT EXISTS dia INTEGER DEFAULT EXTRACT(DAY FROM NOW()),
ADD COLUMN IF NOT EXISTS fechado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fechado_por UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar campos temporais a company_extra_expenses  
ALTER TABLE public.company_extra_expenses
ADD COLUMN IF NOT EXISTS ano INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
ADD COLUMN IF NOT EXISTS mes INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
ADD COLUMN IF NOT EXISTS semana INTEGER DEFAULT EXTRACT(WEEK FROM NOW()),
ADD COLUMN IF NOT EXISTS dia INTEGER DEFAULT EXTRACT(DAY FROM NOW()),
ADD COLUMN IF NOT EXISTS fechado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fechado_por UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabela de fechamento mensal da empresa
CREATE TABLE IF NOT EXISTS public.company_monthly_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_gastos_fixos NUMERIC DEFAULT 0,
  total_gastos_extras NUMERIC DEFAULT 0,
  total_receitas NUMERIC DEFAULT 0,
  saldo_periodo NUMERIC DEFAULT 0,
  qtd_gastos_fixos INTEGER DEFAULT 0,
  qtd_gastos_extras INTEGER DEFAULT 0,
  qtd_entradas INTEGER DEFAULT 0,
  observacoes TEXT,
  fechado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- Tabela de fechamento anual da empresa
CREATE TABLE IF NOT EXISTS public.company_yearly_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  total_gastos_fixos NUMERIC DEFAULT 0,
  total_gastos_extras NUMERIC DEFAULT 0,
  total_receitas NUMERIC DEFAULT 0,
  saldo_ano NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  qtd_total_gastos INTEGER DEFAULT 0,
  qtd_total_entradas INTEGER DEFAULT 0,
  melhor_mes INTEGER,
  pior_mes INTEGER,
  observacoes TEXT,
  fechado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.company_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_yearly_closures ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fechamento mensal
CREATE POLICY "Authenticated users can view company monthly closures" 
ON public.company_monthly_closures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert company monthly closures" 
ON public.company_monthly_closures FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update company monthly closures" 
ON public.company_monthly_closures FOR UPDATE TO authenticated USING (true);

-- Políticas RLS para fechamento anual
CREATE POLICY "Authenticated users can view company yearly closures" 
ON public.company_yearly_closures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert company yearly closures" 
ON public.company_yearly_closures FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update company yearly closures" 
ON public.company_yearly_closures FOR UPDATE TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_company_closures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_company_monthly_closures_updated_at
  BEFORE UPDATE ON public.company_monthly_closures
  FOR EACH ROW EXECUTE FUNCTION public.update_company_closures_updated_at();

CREATE TRIGGER update_company_yearly_closures_updated_at
  BEFORE UPDATE ON public.company_yearly_closures
  FOR EACH ROW EXECUTE FUNCTION public.update_company_closures_updated_at();

-- Atualizar registros existentes com campos temporais
UPDATE public.company_fixed_expenses 
SET 
  ano = EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::INTEGER,
  mes = EXTRACT(MONTH FROM COALESCE(created_at, NOW()))::INTEGER,
  semana = EXTRACT(WEEK FROM COALESCE(created_at, NOW()))::INTEGER,
  dia = EXTRACT(DAY FROM COALESCE(created_at, NOW()))::INTEGER
WHERE ano IS NULL;

UPDATE public.company_extra_expenses 
SET 
  ano = EXTRACT(YEAR FROM COALESCE(data, created_at, NOW())::DATE)::INTEGER,
  mes = EXTRACT(MONTH FROM COALESCE(data, created_at, NOW())::DATE)::INTEGER,
  semana = EXTRACT(WEEK FROM COALESCE(data, created_at, NOW())::DATE)::INTEGER,
  dia = EXTRACT(DAY FROM COALESCE(data, created_at, NOW())::DATE)::INTEGER
WHERE ano IS NULL;

-- Habilitar realtime para novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_monthly_closures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_yearly_closures;