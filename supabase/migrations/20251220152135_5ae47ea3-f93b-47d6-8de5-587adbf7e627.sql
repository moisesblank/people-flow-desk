-- ============================================
-- CENTRAL DE PAGAMENTOS COMPLETA - MIGRAÇÃO
-- Fechamento de Mês/Ano com Histórico 50 Anos
-- ============================================

-- Adicionar campos temporais à tabela payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS ano INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM data_vencimento)::INTEGER) STORED,
ADD COLUMN IF NOT EXISTS mes INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM data_vencimento)::INTEGER) STORED,
ADD COLUMN IF NOT EXISTS semana INTEGER GENERATED ALWAYS AS (EXTRACT(WEEK FROM data_vencimento)::INTEGER) STORED,
ADD COLUMN IF NOT EXISTS dia INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM data_vencimento)::INTEGER) STORED,
ADD COLUMN IF NOT EXISTS fechado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fechado_por UUID REFERENCES auth.users(id);

-- Criar índices para performance em consultas temporais
CREATE INDEX IF NOT EXISTS idx_payments_ano_mes ON public.payments(ano, mes);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_fechado ON public.payments(fechado);
CREATE INDEX IF NOT EXISTS idx_payments_data_vencimento ON public.payments(data_vencimento);

-- ============================================
-- Tabela de Fechamentos Mensais de Pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments_monthly_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'all',
  total_pagamentos INTEGER DEFAULT 0,
  total_valor_pago INTEGER DEFAULT 0,
  total_valor_pendente INTEGER DEFAULT 0,
  total_valor_atrasado INTEGER DEFAULT 0,
  total_pago INTEGER DEFAULT 0,
  total_pendente INTEGER DEFAULT 0,
  total_atrasado INTEGER DEFAULT 0,
  total_cancelado INTEGER DEFAULT 0,
  resumo_por_tipo JSONB DEFAULT '{}',
  resumo_por_metodo JSONB DEFAULT '{}',
  is_fechado BOOLEAN DEFAULT FALSE,
  fechado_em TIMESTAMP WITH TIME ZONE,
  fechado_por UUID REFERENCES auth.users(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_monthly_closure UNIQUE(ano, mes, tipo)
);

-- Habilitar RLS
ALTER TABLE public.payments_monthly_closures ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fechamentos mensais
CREATE POLICY "Users can view all monthly closures" 
ON public.payments_monthly_closures 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create monthly closures" 
ON public.payments_monthly_closures 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update monthly closures" 
ON public.payments_monthly_closures 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- ============================================
-- Tabela de Fechamentos Anuais de Pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments_yearly_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL UNIQUE,
  total_meses_fechados INTEGER DEFAULT 0,
  total_pagamentos INTEGER DEFAULT 0,
  total_valor_pago INTEGER DEFAULT 0,
  total_valor_geral INTEGER DEFAULT 0,
  media_mensal INTEGER DEFAULT 0,
  melhor_mes INTEGER,
  melhor_mes_valor INTEGER DEFAULT 0,
  pior_mes INTEGER,
  pior_mes_valor INTEGER DEFAULT 0,
  resumo_por_tipo JSONB DEFAULT '{}',
  resumo_por_metodo JSONB DEFAULT '{}',
  is_fechado BOOLEAN DEFAULT FALSE,
  fechado_em TIMESTAMP WITH TIME ZONE,
  fechado_por UUID REFERENCES auth.users(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.payments_yearly_closures ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fechamentos anuais
CREATE POLICY "Users can view all yearly closures" 
ON public.payments_yearly_closures 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create yearly closures" 
ON public.payments_yearly_closures 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update yearly closures" 
ON public.payments_yearly_closures 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- ============================================
-- Habilitar Realtime para novas tabelas
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments_monthly_closures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments_yearly_closures;

-- ============================================
-- Função para atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_payments_closure_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_payments_monthly_closures_updated_at
BEFORE UPDATE ON public.payments_monthly_closures
FOR EACH ROW
EXECUTE FUNCTION update_payments_closure_updated_at();

CREATE TRIGGER update_payments_yearly_closures_updated_at
BEFORE UPDATE ON public.payments_yearly_closures
FOR EACH ROW
EXECUTE FUNCTION update_payments_closure_updated_at();