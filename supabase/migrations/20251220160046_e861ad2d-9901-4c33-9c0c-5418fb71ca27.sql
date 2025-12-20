-- =========================================================
-- MEGA MIGRATION v2: Sistema Temporal Completo
-- Corrigido: Triggers específicos por tabela
-- =========================================================

-- =========================================================
-- TABELAS DE FECHAMENTO MENSAL
-- =========================================================

-- FINANÇAS PESSOAIS - Fechamento Mensal
CREATE TABLE IF NOT EXISTS personal_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_gastos_fixos NUMERIC DEFAULT 0,
  total_gastos_extras NUMERIC DEFAULT 0,
  saldo_periodo NUMERIC DEFAULT 0,
  qtd_gastos_fixos INTEGER DEFAULT 0,
  qtd_gastos_extras INTEGER DEFAULT 0,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- FINANÇAS PESSOAIS - Fechamento Anual
CREATE TABLE IF NOT EXISTS personal_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_gastos_fixos NUMERIC DEFAULT 0,
  total_gastos_extras NUMERIC DEFAULT 0,
  saldo_ano NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  melhor_mes INTEGER,
  pior_mes INTEGER,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENTRADAS/RECEITAS - Fechamento Mensal
CREATE TABLE IF NOT EXISTS entradas_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_receitas NUMERIC DEFAULT 0,
  total_impostos NUMERIC DEFAULT 0,
  liquido NUMERIC DEFAULT 0,
  qtd_entradas INTEGER DEFAULT 0,
  qtd_impostos INTEGER DEFAULT 0,
  por_fonte JSONB DEFAULT '{}',
  por_banco JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- ENTRADAS/RECEITAS - Fechamento Anual
CREATE TABLE IF NOT EXISTS entradas_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_receitas NUMERIC DEFAULT 0,
  total_impostos NUMERIC DEFAULT 0,
  liquido_ano NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  melhor_mes INTEGER,
  pior_mes INTEGER,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTAS A PAGAR - Fechamento Mensal
CREATE TABLE IF NOT EXISTS contas_pagar_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_pago NUMERIC DEFAULT 0,
  total_pendente NUMERIC DEFAULT 0,
  total_atrasado NUMERIC DEFAULT 0,
  qtd_contas INTEGER DEFAULT 0,
  por_categoria JSONB DEFAULT '{}',
  por_fornecedor JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- CONTAS A PAGAR - Fechamento Anual
CREATE TABLE IF NOT EXISTS contas_pagar_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_pago NUMERIC DEFAULT 0,
  total_pendente NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTAS A RECEBER - Fechamento Mensal
CREATE TABLE IF NOT EXISTS contas_receber_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_recebido NUMERIC DEFAULT 0,
  total_pendente NUMERIC DEFAULT 0,
  total_atrasado NUMERIC DEFAULT 0,
  qtd_contas INTEGER DEFAULT 0,
  por_categoria JSONB DEFAULT '{}',
  por_cliente JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- CONTAS A RECEBER - Fechamento Anual
CREATE TABLE IF NOT EXISTS contas_receber_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_recebido NUMERIC DEFAULT 0,
  total_pendente NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMISSÕES - Fechamento Mensal
CREATE TABLE IF NOT EXISTS comissoes_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_comissoes NUMERIC DEFAULT 0,
  total_pago NUMERIC DEFAULT 0,
  total_pendente NUMERIC DEFAULT 0,
  qtd_comissoes INTEGER DEFAULT 0,
  qtd_afiliados_ativos INTEGER DEFAULT 0,
  por_afiliado JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- COMISSÕES - Fechamento Anual
CREATE TABLE IF NOT EXISTS comissoes_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_comissoes NUMERIC DEFAULT 0,
  total_pago NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  melhor_afiliado_id INTEGER,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTABILIDADE - Fechamento Mensal
CREATE TABLE IF NOT EXISTS contabilidade_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_receitas NUMERIC DEFAULT 0,
  total_despesas NUMERIC DEFAULT 0,
  total_investimentos NUMERIC DEFAULT 0,
  total_impostos NUMERIC DEFAULT 0,
  lucro_liquido NUMERIC DEFAULT 0,
  margem_lucro NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  cac NUMERIC DEFAULT 0,
  por_topico JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- CONTABILIDADE - Fechamento Anual
CREATE TABLE IF NOT EXISTS contabilidade_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_receitas NUMERIC DEFAULT 0,
  total_despesas NUMERIC DEFAULT 0,
  total_investimentos NUMERIC DEFAULT 0,
  total_impostos NUMERIC DEFAULT 0,
  lucro_liquido_ano NUMERIC DEFAULT 0,
  margem_media NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSAÇÕES HOTMART - Fechamento Mensal
CREATE TABLE IF NOT EXISTS hotmart_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_transacoes INTEGER DEFAULT 0,
  total_aprovadas INTEGER DEFAULT 0,
  total_canceladas INTEGER DEFAULT 0,
  total_reembolsadas INTEGER DEFAULT 0,
  receita_bruta NUMERIC DEFAULT 0,
  receita_liquida NUMERIC DEFAULT 0,
  valor_cancelado NUMERIC DEFAULT 0,
  por_produto JSONB DEFAULT '{}',
  por_afiliado JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- TRANSAÇÕES HOTMART - Fechamento Anual
CREATE TABLE IF NOT EXISTS hotmart_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_transacoes INTEGER DEFAULT 0,
  total_aprovadas INTEGER DEFAULT 0,
  total_canceladas INTEGER DEFAULT 0,
  receita_ano NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  melhor_mes INTEGER,
  pior_mes INTEGER,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FOLHA DE PAGAMENTO - Fechamento Mensal
CREATE TABLE IF NOT EXISTS folha_monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_salarios NUMERIC DEFAULT 0,
  total_beneficios NUMERIC DEFAULT 0,
  total_descontos NUMERIC DEFAULT 0,
  total_liquido NUMERIC DEFAULT 0,
  qtd_funcionarios INTEGER DEFAULT 0,
  por_departamento JSONB DEFAULT '{}',
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- FOLHA DE PAGAMENTO - Fechamento Anual
CREATE TABLE IF NOT EXISTS folha_yearly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  total_salarios NUMERIC DEFAULT 0,
  total_beneficios NUMERIC DEFAULT 0,
  total_13 NUMERIC DEFAULT 0,
  total_ferias NUMERIC DEFAULT 0,
  custo_total_ano NUMERIC DEFAULT 0,
  meses_fechados INTEGER DEFAULT 0,
  observacoes TEXT,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- RLS POLICIES PARA TODAS AS TABELAS
-- =========================================================

ALTER TABLE personal_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contabilidade_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contabilidade_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotmart_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotmart_yearly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_yearly_closures ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all on personal_monthly_closures" ON personal_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on personal_yearly_closures" ON personal_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on entradas_monthly_closures" ON entradas_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on entradas_yearly_closures" ON entradas_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contas_pagar_monthly_closures" ON contas_pagar_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contas_pagar_yearly_closures" ON contas_pagar_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contas_receber_monthly_closures" ON contas_receber_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contas_receber_yearly_closures" ON contas_receber_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comissoes_monthly_closures" ON comissoes_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comissoes_yearly_closures" ON comissoes_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contabilidade_monthly_closures" ON contabilidade_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contabilidade_yearly_closures" ON contabilidade_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on hotmart_monthly_closures" ON hotmart_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on hotmart_yearly_closures" ON hotmart_yearly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on folha_monthly_closures" ON folha_monthly_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on folha_yearly_closures" ON folha_yearly_closures FOR ALL USING (true) WITH CHECK (true);