
-- =====================================================
-- 🧠 TRAMON v8 - ECOSSISTEMA NEURAL AUTÔNOMO
-- FASE 1: DATA WAREHOUSE COMPLETO
-- =====================================================

-- 1. WEBHOOKS_QUEUE - Fila de processamento resiliente
CREATE TABLE IF NOT EXISTS public.webhooks_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- hotmart, wordpress, whatsapp, rdstation
  event TEXT NOT NULL, -- purchase_approved, user_created, etc
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_queue_status ON public.webhooks_queue(status);
CREATE INDEX idx_webhooks_queue_source ON public.webhooks_queue(source);
CREATE INDEX idx_webhooks_queue_created ON public.webhooks_queue(created_at DESC);

-- 2. TRANSACOES_HOTMART_COMPLETO - Dados completos de transações
CREATE TABLE IF NOT EXISTS public.transacoes_hotmart_completo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  product_id TEXT,
  product_name TEXT,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_cpf TEXT,
  status TEXT NOT NULL, -- approved, refunded, cancelled, etc
  valor_bruto DECIMAL(12,2),
  valor_liquido DECIMAL(12,2),
  metodo_pagamento TEXT,
  parcelas INTEGER DEFAULT 1,
  affiliate_id TEXT,
  affiliate_name TEXT,
  comissao_afiliado DECIMAL(12,2) DEFAULT 0,
  hotmart_fee DECIMAL(12,2),
  motivo_cancelamento TEXT,
  data_compra TIMESTAMPTZ,
  data_confirmacao TIMESTAMPTZ,
  data_cancelamento TIMESTAMPTZ,
  webhook_raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transacoes_hotmart_email ON public.transacoes_hotmart_completo(buyer_email);
CREATE INDEX idx_transacoes_hotmart_status ON public.transacoes_hotmart_completo(status);
CREATE INDEX idx_transacoes_hotmart_data ON public.transacoes_hotmart_completo(data_compra DESC);

-- 3. USUARIOS_WORDPRESS_SYNC - Sincronização de usuários WP
CREATE TABLE IF NOT EXISTS public.usuarios_wordpress_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_user_id INTEGER UNIQUE NOT NULL,
  email TEXT NOT NULL,
  nome TEXT,
  username TEXT,
  grupos JSONB DEFAULT '[]', -- ["beta", "premium", etc]
  roles JSONB DEFAULT '[]', -- ["subscriber", "student", etc]
  data_cadastro_wp TIMESTAMPTZ,
  ultimo_login TIMESTAMPTZ,
  ultimo_acesso_curso TIMESTAMPTZ,
  progresso_curso DECIMAL(5,2) DEFAULT 0,
  status_acesso TEXT DEFAULT 'ativo', -- ativo, suspenso, expirado
  tem_pagamento_confirmado BOOLEAN DEFAULT FALSE,
  transaction_id_vinculado TEXT,
  sync_status TEXT DEFAULT 'synced', -- synced, pending, error
  sync_error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wp_sync_email ON public.usuarios_wordpress_sync(email);
CREATE INDEX idx_wp_sync_pagamento ON public.usuarios_wordpress_sync(tem_pagamento_confirmado);
CREATE UNIQUE INDEX idx_wp_sync_wp_id ON public.usuarios_wordpress_sync(wp_user_id);

-- 4. AUDITORIA_GRUPO_BETA_COMPLETO - Auditoria de acessos
CREATE TABLE IF NOT EXISTS public.auditoria_grupo_beta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nome TEXT,
  wp_user_id INTEGER,
  tipo_discrepancia TEXT NOT NULL, -- acesso_indevido, pagamento_pendente, expirado
  status_anterior TEXT,
  status_novo TEXT,
  antes_grupos JSONB,
  depois_grupos JSONB,
  valor_transacao DECIMAL(12,2),
  acao_tomada TEXT, -- removido, notificado, mantido
  executado_por TEXT, -- sistema, admin, manual
  ip_origem TEXT,
  sucesso BOOLEAN DEFAULT TRUE,
  erro_mensagem TEXT,
  data_deteccao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_acao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_beta_email ON public.auditoria_grupo_beta(email);
CREATE INDEX idx_auditoria_beta_tipo ON public.auditoria_grupo_beta(tipo_discrepancia);
CREATE INDEX idx_auditoria_beta_data ON public.auditoria_grupo_beta(data_deteccao DESC);

-- 5. COMANDOS_IA_CENTRAL - Orquestração das 4 IAs
CREATE TABLE IF NOT EXISTS public.comandos_ia_central (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ia_destino TEXT NOT NULL, -- manus, lovable, chatgpt, tramon
  ia_origem TEXT, -- quem disparou (pode ser sistema ou outra IA)
  acao TEXT NOT NULL, -- liberar_acesso_wp, gerar_email, notificar_admin
  parametros JSONB NOT NULL DEFAULT '{}',
  prioridade INTEGER DEFAULT 5, -- 1 = urgente, 10 = baixa
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  resultado JSONB,
  erro TEXT,
  tempo_execucao_ms INTEGER,
  contexto_id UUID, -- referência ao contexto compartilhado
  webhook_trigger_id UUID REFERENCES webhooks_queue(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_comandos_ia_destino ON public.comandos_ia_central(ia_destino);
CREATE INDEX idx_comandos_ia_status ON public.comandos_ia_central(status);
CREATE INDEX idx_comandos_ia_prioridade ON public.comandos_ia_central(prioridade, created_at);

-- 6. CONTEXTO_COMPARTILHADO_IAS - Memória compartilhada entre IAs
CREATE TABLE IF NOT EXISTS public.contexto_compartilhado_ias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL,
  tipo_contexto TEXT NOT NULL, -- aluno, transacao, tarefa, campanha
  entidade_id TEXT, -- ID da entidade relacionada
  dados JSONB NOT NULL DEFAULT '{}',
  ia_criadora TEXT NOT NULL,
  ias_com_acesso TEXT[] DEFAULT ARRAY['manus', 'lovable', 'chatgpt', 'tramon'],
  versao INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE,
  expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contexto_sessao ON public.contexto_compartilhado_ias(sessao_id);
CREATE INDEX idx_contexto_tipo ON public.contexto_compartilhado_ias(tipo_contexto);
CREATE INDEX idx_contexto_ativo ON public.contexto_compartilhado_ias(ativo) WHERE ativo = TRUE;

-- 7. METRICAS_DIARIAS - Business Intelligence
CREATE TABLE IF NOT EXISTS public.metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  -- Métricas de Vendas
  total_vendas INTEGER DEFAULT 0,
  receita_bruta DECIMAL(12,2) DEFAULT 0,
  receita_liquida DECIMAL(12,2) DEFAULT 0,
  ticket_medio DECIMAL(12,2) DEFAULT 0,
  cancelamentos INTEGER DEFAULT 0,
  valor_cancelado DECIMAL(12,2) DEFAULT 0,
  reembolsos INTEGER DEFAULT 0,
  valor_reembolsado DECIMAL(12,2) DEFAULT 0,
  -- Métricas de Alunos
  novos_alunos INTEGER DEFAULT 0,
  alunos_ativos INTEGER DEFAULT 0,
  acessos_plataforma INTEGER DEFAULT 0,
  aulas_concluidas INTEGER DEFAULT 0,
  certificados_emitidos INTEGER DEFAULT 0,
  -- Métricas de Marketing
  leads_gerados INTEGER DEFAULT 0,
  leads_qualificados INTEGER DEFAULT 0,
  taxa_conversao DECIMAL(5,4) DEFAULT 0,
  custo_aquisicao DECIMAL(12,2) DEFAULT 0,
  -- Métricas de Sistema
  webhooks_recebidos INTEGER DEFAULT 0,
  webhooks_processados INTEGER DEFAULT 0,
  webhooks_falha INTEGER DEFAULT 0,
  tempo_medio_processamento_ms INTEGER DEFAULT 0,
  -- Métricas de IA
  comandos_ia_executados INTEGER DEFAULT 0,
  comandos_ia_sucesso INTEGER DEFAULT 0,
  -- Metadata
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metricas_diarias_data ON public.metricas_diarias(data DESC);

-- 8. RELATORIOS_GERADOS - Histórico de relatórios
CREATE TABLE IF NOT EXISTS public.relatorios_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL, -- diario, semanal, mensal, auditoria, custom
  titulo TEXT NOT NULL,
  descricao TEXT,
  periodo_inicio DATE,
  periodo_fim DATE,
  dados JSONB NOT NULL,
  formato TEXT DEFAULT 'json', -- json, pdf, csv, html
  arquivo_url TEXT,
  gerado_por TEXT, -- manus, sistema, manual
  destinatarios TEXT[],
  enviado BOOLEAN DEFAULT FALSE,
  enviado_em TIMESTAMPTZ,
  visualizado BOOLEAN DEFAULT FALSE,
  visualizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relatorios_tipo ON public.relatorios_gerados(tipo);
CREATE INDEX idx_relatorios_data ON public.relatorios_gerados(created_at DESC);

-- 9. LOGS_INTEGRACAO_DETALHADO - Caixa-preta do sistema
CREATE TABLE IF NOT EXISTS public.logs_integracao_detalhado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_queue_id UUID REFERENCES webhooks_queue(id),
  source TEXT NOT NULL,
  event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'iniciado', -- iniciado, processando, sucesso, erro
  etapa_atual TEXT,
  etapas_concluidas JSONB DEFAULT '[]',
  payload_entrada JSONB,
  payload_saida JSONB,
  acoes_executadas JSONB DEFAULT '[]',
  ias_acionadas TEXT[],
  erro_detalhado TEXT,
  stack_trace TEXT,
  tempo_total_ms INTEGER,
  ip_origem TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_integ_status ON public.logs_integracao_detalhado(status);
CREATE INDEX idx_logs_integ_source ON public.logs_integracao_detalhado(source);
CREATE INDEX idx_logs_integ_data ON public.logs_integracao_detalhado(created_at DESC);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_tramon()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_transacoes_hotmart_updated 
  BEFORE UPDATE ON transacoes_hotmart_completo 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_tramon();

CREATE TRIGGER tr_usuarios_wp_sync_updated 
  BEFORE UPDATE ON usuarios_wordpress_sync 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_tramon();

CREATE TRIGGER tr_contexto_ias_updated 
  BEFORE UPDATE ON contexto_compartilhado_ias 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_tramon();

CREATE TRIGGER tr_logs_integ_updated 
  BEFORE UPDATE ON logs_integracao_detalhado 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_tramon();

-- =====================================================
-- RLS POLICIES - Segurança Total
-- =====================================================

ALTER TABLE public.webhooks_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_hotmart_completo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_wordpress_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_grupo_beta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandos_ia_central ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contexto_compartilhado_ias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_gerados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_integracao_detalhado ENABLE ROW LEVEL SECURITY;

-- Policies para Owner/Admin (acesso total)
CREATE POLICY "Owner/Admin full access webhooks_queue" ON public.webhooks_queue
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access transacoes_hotmart" ON public.transacoes_hotmart_completo
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access usuarios_wp_sync" ON public.usuarios_wordpress_sync
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access auditoria_beta" ON public.auditoria_grupo_beta
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access comandos_ia" ON public.comandos_ia_central
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access contexto_ias" ON public.contexto_compartilhado_ias
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access metricas_diarias" ON public.metricas_diarias
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access relatorios" ON public.relatorios_gerados
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin full access logs_integracao" ON public.logs_integracao_detalhado
  FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- =====================================================
-- REALTIME para Monitoramento
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE webhooks_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE comandos_ia_central;
ALTER PUBLICATION supabase_realtime ADD TABLE logs_integracao_detalhado;

-- =====================================================
-- COMMENT nas tabelas para documentação
-- =====================================================
COMMENT ON TABLE webhooks_queue IS 'Fila resiliente de webhooks - Sistema Nervoso Periférico';
COMMENT ON TABLE transacoes_hotmart_completo IS 'Dados completos de todas as transações Hotmart com auditoria';
COMMENT ON TABLE usuarios_wordpress_sync IS 'Sincronização bidirecional de usuários WordPress';
COMMENT ON TABLE auditoria_grupo_beta IS 'Auditoria de acessos ao grupo beta - detecção de fraudes';
COMMENT ON TABLE comandos_ia_central IS 'Orquestrador central das 4 IAs - Maestro';
COMMENT ON TABLE contexto_compartilhado_ias IS 'Memória compartilhada entre as IAs';
COMMENT ON TABLE metricas_diarias IS 'Business Intelligence - KPIs diários consolidados';
COMMENT ON TABLE relatorios_gerados IS 'Histórico de todos os relatórios gerados pelo sistema';
COMMENT ON TABLE logs_integracao_detalhado IS 'Caixa-preta do sistema - logs detalhados de todas as operações';
