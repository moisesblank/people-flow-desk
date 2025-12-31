-- ============================================
-- TAXONOMIA HIERÁRQUICA DE QUESTÕES
-- MACRO → MICRO → TEMA → SUBTEMA
-- Owner pode gerenciar via UI
-- ============================================

-- Tabela de classificação hierárquica
CREATE TABLE public.question_taxonomy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.question_taxonomy(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('macro', 'micro', 'tema', 'subtema')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT, -- emoji ou ícone
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint para garantir hierarquia correta
  CONSTRAINT valid_hierarchy CHECK (
    (level = 'macro' AND parent_id IS NULL) OR
    (level = 'micro' AND parent_id IS NOT NULL) OR
    (level = 'tema' AND parent_id IS NOT NULL) OR
    (level = 'subtema' AND parent_id IS NOT NULL)
  )
);

-- Índices para performance
CREATE INDEX idx_question_taxonomy_parent ON public.question_taxonomy(parent_id);
CREATE INDEX idx_question_taxonomy_level ON public.question_taxonomy(level);
CREATE INDEX idx_question_taxonomy_value ON public.question_taxonomy(value);
CREATE INDEX idx_question_taxonomy_active ON public.question_taxonomy(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.question_taxonomy ENABLE ROW LEVEL SECURITY;

-- Leitura pública (todos podem ver a taxonomia)
CREATE POLICY "Taxonomia visível para todos autenticados" 
ON public.question_taxonomy 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Apenas Owner pode modificar
CREATE POLICY "Owner pode inserir taxonomia" 
ON public.question_taxonomy 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Owner pode atualizar taxonomia" 
ON public.question_taxonomy 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Owner pode deletar taxonomia" 
ON public.question_taxonomy 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_question_taxonomy_updated_at
BEFORE UPDATE ON public.question_taxonomy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED: Importar dados existentes
-- ============================================

-- MACROS
INSERT INTO public.question_taxonomy (level, value, label, icon, position) VALUES
('macro', 'quimica_geral', 'Química Geral', '⚗️', 1),
('macro', 'quimica_organica', 'Química Orgânica', '🧪', 2),
('macro', 'fisico_quimica', 'Físico-Química', '📊', 3);

-- Obter IDs dos MACROs para inserir MICROs
DO $$
DECLARE
  v_quimica_geral UUID;
  v_quimica_organica UUID;
  v_fisico_quimica UUID;
BEGIN
  SELECT id INTO v_quimica_geral FROM public.question_taxonomy WHERE value = 'quimica_geral' AND level = 'macro';
  SELECT id INTO v_quimica_organica FROM public.question_taxonomy WHERE value = 'quimica_organica' AND level = 'macro';
  SELECT id INTO v_fisico_quimica FROM public.question_taxonomy WHERE value = 'fisico_quimica' AND level = 'macro';

  -- MICROS - Química Geral
  INSERT INTO public.question_taxonomy (parent_id, level, value, label, position) VALUES
  (v_quimica_geral, 'micro', 'introducao_a_inorganica', 'Introdução à Inorgânica', 1),
  (v_quimica_geral, 'micro', 'atomistica', 'Atomística', 2),
  (v_quimica_geral, 'micro', 'tabela_periodica', 'Tabela Periódica', 3),
  (v_quimica_geral, 'micro', 'ligacoes_quimicas', 'Ligações Químicas', 4),
  (v_quimica_geral, 'micro', 'funcoes_inorganicas', 'Funções Inorgânicas', 5),
  (v_quimica_geral, 'micro', 'reacoes_quimicas', 'Reações Químicas', 6),
  (v_quimica_geral, 'micro', 'balanceamento', 'Balanceamento', 7),
  (v_quimica_geral, 'micro', 'nox', 'NOX (Número de Oxidação)', 8),
  (v_quimica_geral, 'micro', 'gases', 'Gases', 9),
  (v_quimica_geral, 'micro', 'estequiometria', 'Estequiometria', 10),
  (v_quimica_geral, 'micro', 'calculos_quimicos', 'Cálculos Químicos', 11);

  -- MICROS - Química Orgânica
  INSERT INTO public.question_taxonomy (parent_id, level, value, label, position) VALUES
  (v_quimica_organica, 'micro', 'fundamentos_da_quimica_organica', 'Fundamentos da Química Orgânica', 1),
  (v_quimica_organica, 'micro', 'estrutura_e_representacao', 'Estrutura e Representação', 2),
  (v_quimica_organica, 'micro', 'cadeias_carbonicas', 'Cadeias Carbônicas', 3),
  (v_quimica_organica, 'micro', 'nomenclatura_organica', 'Nomenclatura Orgânica', 4),
  (v_quimica_organica, 'micro', 'funcoes_organicas', 'Funções Orgânicas', 5),
  (v_quimica_organica, 'micro', 'isomeria', 'Isomeria', 6),
  (v_quimica_organica, 'micro', 'propriedades_dos_compostos_organicos', 'Propriedades dos Compostos Orgânicos', 7),
  (v_quimica_organica, 'micro', 'reacoes_organicas', 'Reações Orgânicas', 8),
  (v_quimica_organica, 'micro', 'polimeros', 'Polímeros', 9),
  (v_quimica_organica, 'micro', 'bioquimica_organica', 'Bioquímica Orgânica', 10),
  (v_quimica_organica, 'micro', 'aplicacoes_e_contextualizacao', 'Aplicações e Contextualização', 11);

  -- MICROS - Físico-Química
  INSERT INTO public.question_taxonomy (parent_id, level, value, label, position) VALUES
  (v_fisico_quimica, 'micro', 'fundamentos_da_fisico_quimica', 'Fundamentos da Físico-Química', 1),
  (v_fisico_quimica, 'micro', 'termoquimica', 'Termoquímica', 2),
  (v_fisico_quimica, 'micro', 'cinetica_quimica', 'Cinética Química', 3),
  (v_fisico_quimica, 'micro', 'equilibrio_quimico', 'Equilíbrio Químico', 4),
  (v_fisico_quimica, 'micro', 'equilibrio_ionico', 'Equilíbrio Iônico', 5),
  (v_fisico_quimica, 'micro', 'solubilidade_e_equilibrio_heterogeneo', 'Solubilidade e Equilíbrio Heterogêneo', 6),
  (v_fisico_quimica, 'micro', 'eletroquimica', 'Eletroquímica', 7),
  (v_fisico_quimica, 'micro', 'propriedades_coligativas', 'Propriedades Coligativas', 8),
  (v_fisico_quimica, 'micro', 'solucoes', 'Soluções', 9),
  (v_fisico_quimica, 'micro', 'gases_fisico_quimica', 'Gases', 10),
  (v_fisico_quimica, 'micro', 'radioatividade', 'Radioatividade', 11);
END $$;