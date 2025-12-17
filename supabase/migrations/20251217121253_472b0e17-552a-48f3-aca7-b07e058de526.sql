-- ============================================
-- TAREFA 1, 2, 3: TABELAS PARA AUTOMAÇÕES
-- ============================================

-- 1. Tabela de Alunos (para automação Hotmart)
CREATE TABLE IF NOT EXISTS public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  status TEXT DEFAULT 'ativo',
  data_matricula TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valor_pago DECIMAL(10, 2) DEFAULT 0,
  hotmart_transaction_id TEXT,
  fonte TEXT DEFAULT 'Hotmart',
  curso_id UUID REFERENCES public.courses(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Entradas/Receitas
CREATE TABLE IF NOT EXISTS public.entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  categoria TEXT DEFAULT 'Vendas',
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fonte TEXT,
  aluno_id UUID REFERENCES public.alunos(id),
  transaction_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Gastos/Despesas
CREATE TABLE IF NOT EXISTS public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  categoria TEXT DEFAULT 'Geral',
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fonte TEXT,
  fornecedor TEXT,
  comprovante_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Comissões de Afiliados
CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id INTEGER REFERENCES public.affiliates(id),
  aluno_id UUID REFERENCES public.alunos(id),
  valor DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pendente',
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_id TEXT,
  descricao TEXT,
  pago_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Métricas Instagram
CREATE TABLE IF NOT EXISTS public.instagram_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  seguidores INTEGER DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  visualizacoes_perfil INTEGER DEFAULT 0,
  engajamento_rate DECIMAL(5, 2) DEFAULT 0,
  novos_seguidores INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Métricas Facebook Ads
CREATE TABLE IF NOT EXISTS public.facebook_ads_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id VARCHAR(255) UNIQUE NOT NULL,
  campanha_nome VARCHAR(255),
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  impressoes INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  ctr DECIMAL(10, 4) DEFAULT 0,
  cpc DECIMAL(10, 2) DEFAULT 0,
  cpm DECIMAL(10, 2) DEFAULT 0,
  investimento DECIMAL(10, 2) DEFAULT 0,
  receita DECIMAL(10, 2) DEFAULT 0,
  roi DECIMAL(10, 2) DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Tarefas (para WhatsApp automation)
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'pendente',
  prioridade TEXT DEFAULT 'normal',
  responsavel TEXT,
  prazo TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  lead_id UUID,
  fonte TEXT DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Adicionar coluna cupom na tabela affiliates se não existir
-- ============================================
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS cupom TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS percentual_comissao DECIMAL(5, 2) DEFAULT 20,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS pix TEXT,
ADD COLUMN IF NOT EXISTS banco TEXT,
ADD COLUMN IF NOT EXISTS agencia TEXT,
ADD COLUMN IF NOT EXISTS conta TEXT,
ADD COLUMN IF NOT EXISTS parceiro_aluno BOOLEAN DEFAULT false;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Alunos
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alunos" ON public.alunos
FOR ALL USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Service can insert alunos" ON public.alunos
FOR INSERT WITH CHECK (true);

-- Entradas
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial can manage entradas" ON public.entradas
FOR ALL USING (can_view_financial(auth.uid()));

CREATE POLICY "Service can insert entradas" ON public.entradas
FOR INSERT WITH CHECK (true);

-- Gastos
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial can manage gastos" ON public.gastos
FOR ALL USING (can_view_financial(auth.uid()));

CREATE POLICY "Service can insert gastos" ON public.gastos
FOR INSERT WITH CHECK (true);

-- Comissões
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage comissoes" ON public.comissoes
FOR ALL USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Service can insert comissoes" ON public.comissoes
FOR INSERT WITH CHECK (true);

-- Instagram Metrics
ALTER TABLE public.instagram_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage instagram_metrics" ON public.instagram_metrics
FOR ALL USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Service can insert instagram_metrics" ON public.instagram_metrics
FOR INSERT WITH CHECK (true);

-- Facebook Ads Metrics
ALTER TABLE public.facebook_ads_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage facebook_ads_metrics" ON public.facebook_ads_metrics
FOR ALL USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Service can insert/update facebook_ads_metrics" ON public.facebook_ads_metrics
FOR ALL WITH CHECK (true);

-- Tarefas
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tarefas" ON public.tarefas
FOR ALL USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Service can insert tarefas" ON public.tarefas
FOR INSERT WITH CHECK (true);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_alunos_email ON public.alunos(email);
CREATE INDEX IF NOT EXISTS idx_alunos_hotmart_tx ON public.alunos(hotmart_transaction_id);
CREATE INDEX IF NOT EXISTS idx_entradas_data ON public.entradas(data);
CREATE INDEX IF NOT EXISTS idx_entradas_fonte ON public.entradas(fonte);
CREATE INDEX IF NOT EXISTS idx_gastos_data ON public.gastos(data);
CREATE INDEX IF NOT EXISTS idx_comissoes_afiliado ON public.comissoes(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON public.comissoes(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON public.tarefas(prioridade);
CREATE INDEX IF NOT EXISTS idx_instagram_metrics_data ON public.instagram_metrics(data);
CREATE INDEX IF NOT EXISTS idx_facebook_ads_data ON public.facebook_ads_metrics(data);