-- ============================================
-- CORREIOS: TABELA DE ENVIOS OFICIAIS
-- CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
-- ============================================

-- Enum para status de envio
DO $$ BEGIN
  CREATE TYPE public.correios_envio_status AS ENUM (
    'pendente',
    'endereco_validado',
    'postado',
    'em_transito',
    'entregue',
    'devolvido',
    'extraviado',
    'cancelado'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de envios via Correios
CREATE TABLE IF NOT EXISTS public.envios_correios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  
  -- Destinatário
  destinatario_nome TEXT NOT NULL,
  destinatario_email TEXT NOT NULL,
  destinatario_telefone TEXT,
  
  -- Endereço (cópia do momento do envio)
  endereco_cep TEXT NOT NULL,
  endereco_logradouro TEXT NOT NULL,
  endereco_numero TEXT NOT NULL,
  endereco_complemento TEXT,
  endereco_bairro TEXT NOT NULL,
  endereco_cidade TEXT NOT NULL,
  endereco_estado TEXT NOT NULL,
  
  -- Validação Correios
  endereco_validado BOOLEAN DEFAULT FALSE,
  endereco_validado_at TIMESTAMPTZ,
  endereco_correios_response JSONB,
  
  -- Código de rastreio oficial
  codigo_rastreio TEXT,
  codigo_rastreio_validado BOOLEAN DEFAULT FALSE,
  codigo_rastreio_validado_at TIMESTAMPTZ,
  
  -- Dados do envio
  servico_correios TEXT, -- SEDEX, PAC, etc.
  peso_gramas INTEGER,
  dimensoes JSONB, -- {altura, largura, comprimento}
  valor_declarado DECIMAL(10,2),
  valor_frete DECIMAL(10,2),
  
  -- Status
  status public.correios_envio_status DEFAULT 'pendente',
  data_postagem TIMESTAMPTZ,
  data_entrega_prevista TIMESTAMPTZ,
  data_entrega_real TIMESTAMPTZ,
  
  -- Notificações
  notificacao_postagem_enviada BOOLEAN DEFAULT FALSE,
  notificacao_entrega_enviada BOOLEAN DEFAULT FALSE,
  
  -- Histórico de eventos do rastreio
  eventos_rastreio JSONB DEFAULT '[]'::jsonb,
  ultimo_evento_at TIMESTAMPTZ,
  
  -- Metadados
  descricao_conteudo TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca por aluno
CREATE INDEX IF NOT EXISTS idx_envios_correios_aluno ON public.envios_correios(aluno_id);

-- Index para busca por código de rastreio
CREATE INDEX IF NOT EXISTS idx_envios_correios_rastreio ON public.envios_correios(codigo_rastreio);

-- Index para busca por status
CREATE INDEX IF NOT EXISTS idx_envios_correios_status ON public.envios_correios(status);

-- Enable RLS
ALTER TABLE public.envios_correios ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas owner/admin podem gerenciar envios
CREATE POLICY "Gestão pode ver envios" ON public.envios_correios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin', 'coordenacao', 'suporte')
    )
  );

CREATE POLICY "Gestão pode criar envios" ON public.envios_correios
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Gestão pode atualizar envios" ON public.envios_correios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_envios_correios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_envios_correios_timestamp ON public.envios_correios;
CREATE TRIGGER update_envios_correios_timestamp
  BEFORE UPDATE ON public.envios_correios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_envios_correios_updated_at();

-- Comentários
COMMENT ON TABLE public.envios_correios IS 'Envios oficiais via Correios para alunos';
COMMENT ON COLUMN public.envios_correios.codigo_rastreio IS 'Código de rastreio oficial dos Correios';
COMMENT ON COLUMN public.envios_correios.endereco_validado IS 'Indica se endereço foi validado pela API oficial dos Correios';