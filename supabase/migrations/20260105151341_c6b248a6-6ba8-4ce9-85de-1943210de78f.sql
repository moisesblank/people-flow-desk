-- =============================================
-- TABELA ASSUNTOS (necessária para FK)
-- =============================================
CREATE TABLE IF NOT EXISTS public.assuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT,
  icone TEXT,
  posicao INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para assuntos
ALTER TABLE public.assuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assuntos visíveis para autenticados" ON public.assuntos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem modificar assuntos" ON public.assuntos
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- =============================================
-- TABELA QUESTOES (estrutura definitiva)
-- =============================================
CREATE TABLE IF NOT EXISTS public.questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Enunciado
  enunciado TEXT NOT NULL,
  imagem_enunciado TEXT,
  
  -- Alternativas (A, B, C, D, E)
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  alternativa_e TEXT NOT NULL,
  
  -- Imagens das alternativas (opcionais)
  imagem_a TEXT,
  imagem_b TEXT,
  imagem_c TEXT,
  imagem_d TEXT,
  imagem_e TEXT,
  
  -- Gabarito
  gabarito CHAR(1) NOT NULL CHECK (gabarito IN ('A', 'B', 'C', 'D', 'E')),
  
  -- Resolução
  resolucao TEXT,
  video_resolucao_id TEXT,
  
  -- Competências ENEM
  competencia_enem INTEGER CHECK (competencia_enem BETWEEN 1 AND 8),
  competencia_enem_descricao TEXT,
  habilidade_enem INTEGER CHECK (habilidade_enem BETWEEN 1 AND 30),
  habilidade_enem_descricao TEXT,
  
  -- Direcionamento/Estratégia do Professor
  direcionamento TEXT,
  
  -- Estatísticas
  taxa_erro DECIMAL(5,2) DEFAULT 0,
  total_respostas INTEGER DEFAULT 0,
  total_acertos INTEGER DEFAULT 0,
  
  -- Metadados
  dificuldade TEXT NOT NULL DEFAULT 'medio' CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  banca TEXT,
  ano INTEGER,
  assunto_id UUID REFERENCES public.assuntos(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_questoes_assunto ON public.questoes(assunto_id);
CREATE INDEX idx_questoes_dificuldade ON public.questoes(dificuldade);
CREATE INDEX idx_questoes_banca ON public.questoes(banca);
CREATE INDEX idx_questoes_ano ON public.questoes(ano);

-- RLS
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler questões
CREATE POLICY "Questões visíveis para autenticados" ON public.questoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Apenas admins/owner podem modificar (usando sistema de roles correto)
CREATE POLICY "Apenas admins podem inserir questões" ON public.questoes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Apenas admins podem atualizar questões" ON public.questoes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Apenas admins podem deletar questões" ON public.questoes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_questoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_questoes_updated_at
  BEFORE UPDATE ON public.questoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questoes_updated_at();

-- Trigger para assuntos updated_at
CREATE TRIGGER trigger_assuntos_updated_at
  BEFORE UPDATE ON public.assuntos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questoes_updated_at();