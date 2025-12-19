-- =====================================================
-- MIGRAÇÃO COMPLETA OLA50 - TABELAS FINANCEIRAS E RH
-- =====================================================

-- 1. FOLHA DE PAGAMENTO
CREATE TABLE public.folha_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id INTEGER REFERENCES public.employees(id) ON DELETE CASCADE,
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia >= 1 AND mes_referencia <= 12),
  ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
  salario_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  inss NUMERIC(12,2) DEFAULT 0,
  irrf NUMERIC(12,2) DEFAULT 0,
  fgts NUMERIC(12,2) DEFAULT 0,
  vale_transporte NUMERIC(12,2) DEFAULT 0,
  vale_refeicao NUMERIC(12,2) DEFAULT 0,
  outros_descontos NUMERIC(12,2) DEFAULT 0,
  outros_beneficios NUMERIC(12,2) DEFAULT 0,
  salario_liquido NUMERIC(12,2) GENERATED ALWAYS AS (
    salario_bruto - inss - irrf - vale_transporte - outros_descontos + outros_beneficios
  ) STORED,
  horas_extras NUMERIC(6,2) DEFAULT 0,
  valor_horas_extras NUMERIC(12,2) DEFAULT 0,
  faltas INTEGER DEFAULT 0,
  desconto_faltas NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processado', 'pago', 'cancelado')),
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(employee_id, mes_referencia, ano_referencia)
);

-- 2. PONTO ELETRÔNICO
CREATE TABLE public.ponto_eletronico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id INTEGER REFERENCES public.employees(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrada_1 TIME,
  saida_1 TIME,
  entrada_2 TIME,
  saida_2 TIME,
  horas_trabalhadas NUMERIC(5,2),
  horas_extras NUMERIC(5,2) DEFAULT 0,
  tipo VARCHAR(20) DEFAULT 'normal' CHECK (tipo IN ('normal', 'falta', 'ferias', 'atestado', 'folga', 'feriado')),
  justificativa TEXT,
  aprovado BOOLEAN DEFAULT false,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, data)
);

-- 3. CONTAS A PAGAR
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  fornecedor VARCHAR(255),
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  categoria VARCHAR(100),
  centro_custo VARCHAR(100),
  numero_documento VARCHAR(100),
  forma_pagamento VARCHAR(50),
  conta_bancaria_id UUID REFERENCES public.bank_accounts(id),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  recorrente BOOLEAN DEFAULT false,
  frequencia_recorrencia VARCHAR(20) CHECK (frequencia_recorrencia IN ('mensal', 'quinzenal', 'semanal', 'anual')),
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. CONTAS A RECEBER
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  cliente VARCHAR(255),
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  categoria VARCHAR(100),
  origem VARCHAR(100),
  numero_documento VARCHAR(100),
  forma_recebimento VARCHAR(50),
  conta_bancaria_id UUID REFERENCES public.bank_accounts(id),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')),
  recorrente BOOLEAN DEFAULT false,
  frequencia_recorrencia VARCHAR(20) CHECK (frequencia_recorrencia IN ('mensal', 'quinzenal', 'semanal', 'anual')),
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. FLUXO DE CAIXA DIÁRIO (para visão consolidada)
CREATE TABLE public.fluxo_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  conta_bancaria_id UUID REFERENCES public.bank_accounts(id),
  saldo_inicial NUMERIC(12,2) DEFAULT 0,
  total_entradas NUMERIC(12,2) DEFAULT 0,
  total_saidas NUMERIC(12,2) DEFAULT 0,
  saldo_final NUMERIC(12,2) GENERATED ALWAYS AS (saldo_inicial + total_entradas - total_saidas) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(data, conta_bancaria_id)
);

-- Habilitar RLS
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_eletronico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Authenticated users can view folha_pagamento" ON public.folha_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert folha_pagamento" ON public.folha_pagamento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update folha_pagamento" ON public.folha_pagamento FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete folha_pagamento" ON public.folha_pagamento FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view ponto_eletronico" ON public.ponto_eletronico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ponto_eletronico" ON public.ponto_eletronico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ponto_eletronico" ON public.ponto_eletronico FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete ponto_eletronico" ON public.ponto_eletronico FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contas_pagar" ON public.contas_pagar FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contas_pagar" ON public.contas_pagar FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete contas_pagar" ON public.contas_pagar FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contas_receber" ON public.contas_receber FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contas_receber" ON public.contas_receber FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete contas_receber" ON public.contas_receber FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view fluxo_caixa" ON public.fluxo_caixa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fluxo_caixa" ON public.fluxo_caixa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fluxo_caixa" ON public.fluxo_caixa FOR UPDATE TO authenticated USING (true);

-- Índices para performance
CREATE INDEX idx_folha_pagamento_employee ON public.folha_pagamento(employee_id);
CREATE INDEX idx_folha_pagamento_mes_ano ON public.folha_pagamento(mes_referencia, ano_referencia);
CREATE INDEX idx_ponto_eletronico_employee ON public.ponto_eletronico(employee_id);
CREATE INDEX idx_ponto_eletronico_data ON public.ponto_eletronico(data);
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_fluxo_caixa_data ON public.fluxo_caixa(data);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folha_pagamento_timestamp BEFORE UPDATE ON public.folha_pagamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
CREATE TRIGGER update_ponto_eletronico_timestamp BEFORE UPDATE ON public.ponto_eletronico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
CREATE TRIGGER update_contas_pagar_timestamp BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
CREATE TRIGGER update_contas_receber_timestamp BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
CREATE TRIGGER update_fluxo_caixa_timestamp BEFORE UPDATE ON public.fluxo_caixa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();