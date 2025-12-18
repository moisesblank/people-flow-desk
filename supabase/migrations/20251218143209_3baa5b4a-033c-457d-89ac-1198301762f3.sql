-- BLOCO 1: Criar tabelas faltantes e função RPC para TRAMON v8

-- TABELA: alertas_sistema
CREATE TABLE IF NOT EXISTS public.alertas_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  origem VARCHAR(100) NOT NULL,
  destinatarios JSONB NOT NULL DEFAULT '["admin"]',
  status VARCHAR(50) DEFAULT 'novo',
  acao_sugerida TEXT,
  link VARCHAR(500),
  dados JSONB DEFAULT '{}',
  data_leitura TIMESTAMP WITH TIME ZONE,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  resolvido_por VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON public.alertas_sistema(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON public.alertas_sistema(status);
CREATE INDEX IF NOT EXISTS idx_alertas_created ON public.alertas_sistema(created_at DESC);

-- Enable RLS
ALTER TABLE public.alertas_sistema ENABLE ROW LEVEL SECURITY;

-- Policies for alertas_sistema
CREATE POLICY "Owner can view all alerts" ON public.alertas_sistema
FOR SELECT USING (public.is_owner(auth.uid()));

CREATE POLICY "Owner can manage alerts" ON public.alertas_sistema
FOR ALL USING (public.is_owner(auth.uid()));

CREATE POLICY "Service role can insert alerts" ON public.alertas_sistema
FOR INSERT WITH CHECK (true);

-- TABELA: emails_rd_station
CREATE TABLE IF NOT EXISTS public.emails_rd_station (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(500),
  corpo_html TEXT,
  corpo_texto TEXT,
  campanha_id VARCHAR(100),
  template_id VARCHAR(100),
  tags JSONB DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_abertura TIMESTAMP WITH TIME ZONE,
  data_clique TIMESTAMP WITH TIME ZONE,
  link_clicado VARCHAR(500),
  bounce_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_rd_destinatario ON public.emails_rd_station(destinatario);
CREATE INDEX IF NOT EXISTS idx_emails_rd_status ON public.emails_rd_station(status);
CREATE INDEX IF NOT EXISTS idx_emails_rd_created ON public.emails_rd_station(created_at DESC);

ALTER TABLE public.emails_rd_station ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage emails" ON public.emails_rd_station
FOR ALL USING (public.is_owner(auth.uid()));

CREATE POLICY "Service role can insert emails" ON public.emails_rd_station
FOR INSERT WITH CHECK (true);

-- TABELA: conversas_tramon
CREATE TABLE IF NOT EXISTS public.conversas_tramon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  mensagem_usuario TEXT NOT NULL,
  resposta_tramon TEXT NOT NULL,
  contexto JSONB,
  intencao_detectada VARCHAR(100),
  acoes_sugeridas JSONB,
  feedback_usuario VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversas_user ON public.conversas_tramon(user_id);
CREATE INDEX IF NOT EXISTS idx_conversas_created ON public.conversas_tramon(created_at DESC);

ALTER TABLE public.conversas_tramon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversas_tramon
FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

CREATE POLICY "Users can create conversations" ON public.conversas_tramon
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_owner(auth.uid()));

CREATE POLICY "Service role can manage conversations" ON public.conversas_tramon
FOR ALL WITH CHECK (true);

-- TABELA: auditoria_grupo_beta_completo (se não existir totalmente)
CREATE TABLE IF NOT EXISTS public.auditoria_grupo_beta_completo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_wordpress INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  motivo VARCHAR(100) NOT NULL,
  executado_por VARCHAR(100) NOT NULL,
  transaction_id_hotmart VARCHAR(255),
  valor_transacao DECIMAL(10, 2),
  antes_grupos JSONB,
  depois_grupos JSONB,
  sucesso BOOLEAN NOT NULL DEFAULT true,
  mensagem_erro TEXT,
  ip_origem VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_completo_email ON public.auditoria_grupo_beta_completo(email);
CREATE INDEX IF NOT EXISTS idx_auditoria_completo_acao ON public.auditoria_grupo_beta_completo(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_completo_created ON public.auditoria_grupo_beta_completo(created_at DESC);

ALTER TABLE public.auditoria_grupo_beta_completo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view audits" ON public.auditoria_grupo_beta_completo
FOR SELECT USING (public.is_owner(auth.uid()));

CREATE POLICY "Service role can manage audits" ON public.auditoria_grupo_beta_completo
FOR ALL WITH CHECK (true);

-- FUNÇÃO RPC: increment_metrica_diaria
CREATE OR REPLACE FUNCTION public.increment_metrica_diaria(
  p_data DATE,
  p_campo TEXT,
  p_valor NUMERIC
) RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar registro se não existir
  INSERT INTO public.metricas_diarias (data_referencia)
  VALUES (p_data)
  ON CONFLICT (data_referencia) DO NOTHING;

  -- Atualizar o campo específico
  EXECUTE format('UPDATE public.metricas_diarias SET %I = COALESCE(%I, 0) + $1 WHERE data_referencia = $2', p_campo, p_campo)
  USING p_valor, p_data;
END;
$$;

-- Adicionar colunas faltantes em metricas_diarias se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'data_referencia') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN data_referencia DATE UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'novos_cadastros') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN novos_cadastros INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'novos_pagamentos') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN novos_pagamentos INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'cancelamentos') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN cancelamentos INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'receita_dia') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN receita_dia DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'lucro_dia') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN lucro_dia DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_diarias' AND column_name = 'alunos_ativos') THEN
    ALTER TABLE public.metricas_diarias ADD COLUMN alunos_ativos INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adicionar colunas faltantes em transacoes_hotmart_completo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes_hotmart_completo' AND column_name = 'cpf') THEN
    ALTER TABLE public.transacoes_hotmart_completo ADD COLUMN cpf VARCHAR(14);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes_hotmart_completo' AND column_name = 'telefone') THEN
    ALTER TABLE public.transacoes_hotmart_completo ADD COLUMN telefone VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes_hotmart_completo' AND column_name = 'data_cancelamento') THEN
    ALTER TABLE public.transacoes_hotmart_completo ADD COLUMN data_cancelamento TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes_hotmart_completo' AND column_name = 'motivo_cancelamento') THEN
    ALTER TABLE public.transacoes_hotmart_completo ADD COLUMN motivo_cancelamento TEXT;
  END IF;
END $$;

-- Adicionar colunas faltantes em usuarios_wordpress_sync
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios_wordpress_sync' AND column_name = 'grupos') THEN
    ALTER TABLE public.usuarios_wordpress_sync ADD COLUMN grupos JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios_wordpress_sync' AND column_name = 'ultimo_login') THEN
    ALTER TABLE public.usuarios_wordpress_sync ADD COLUMN ultimo_login TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios_wordpress_sync' AND column_name = 'metadata') THEN
    ALTER TABLE public.usuarios_wordpress_sync ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;