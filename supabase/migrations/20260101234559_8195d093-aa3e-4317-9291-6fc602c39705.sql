-- ============================================
-- 🎓 ESTILO ENEM - Sistema Enterprise de Categorização
-- Frentes: Matriz ENEM, Cognição Bloom, Contexto/Estrutura, Genealogia, Qualidade
-- ============================================

-- ============================================
-- 1. MATRIZ ENEM (Competências e Habilidades)
-- Campos: competencia_enem, habilidades_enem
-- ============================================

-- Competência ENEM (C1-C7) - já existe campo 'competencia', mas vamos padronizar
-- Habilidades ENEM (H1-H30) como array para permitir múltiplas
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS habilidades_enem text[] DEFAULT '{}';

-- Objeto de conhecimento (texto livre para especificar)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS objeto_conhecimento text;

-- ============================================
-- 2. DIMENSÃO COGNITIVA (Bloom + Demanda)
-- Campos: nivel_cognitivo_bloom, demanda_cognitiva, tempo_estimado_segundos
-- ============================================

-- Nível cognitivo Bloom (lembrar, entender, aplicar, analisar, avaliar, criar)
-- Já existe 'nivel_cognitivo', mas vamos adicionar demanda
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS demanda_cognitiva text CHECK (demanda_cognitiva IN ('baixa', 'media', 'alta', 'muito_alta'));

-- Tempo estimado em segundos para resolver
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS tempo_estimado_segundos integer DEFAULT 180;

-- Índice de discriminação (0-1, calculado após tentativas)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS indice_discriminacao numeric(3,2);

-- ============================================
-- 3. CONTEXTO E ESTRUTURA (Cara de ENEM)
-- Campos: tipo_estrutura, tem_texto_base, tem_situacao_problema, recursos_visuais, contexto_tematico
-- ============================================

-- Tipo de estrutura da questão
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS tipo_estrutura text CHECK (tipo_estrutura IN ('direta', 'situacao_problema', 'interpretacao_texto', 'analise_dados', 'estudo_caso'));

-- Tem texto-base extenso (característica ENEM)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS tem_texto_base boolean DEFAULT false;

-- Tem situação-problema (característica ENEM)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS tem_situacao_problema boolean DEFAULT false;

-- Recursos visuais (array: grafico, tabela, imagem, diagrama, formula, mapa)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS recursos_visuais text[] DEFAULT '{}';

-- Contexto temático (ambiental, saude, industria, cotidiano, tecnologia, etc)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS contexto_tematico text;

-- Interdisciplinaridade (array de disciplinas relacionadas)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS disciplinas_relacionadas text[] DEFAULT '{}';

-- Flag: é estilo ENEM (questão autoral que segue padrão ENEM)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS is_estilo_enem boolean DEFAULT false;

-- ============================================
-- 4. GENEALOGIA (Controle Editorial)
-- Campos: origem_questao, autor_id, questao_pai_id, versao, data_criacao_original
-- ============================================

-- Origem da questão (oficial, autoral, adaptada, ia_gerada)
-- Já existe 'origem', manter compatibilidade

-- ID do autor (se autoral)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS autor_id uuid;

-- Questão pai (se é adaptação/variação)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS questao_pai_id uuid REFERENCES public.quiz_questions(id) ON DELETE SET NULL;

-- Versão da questão
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS versao integer DEFAULT 1;

-- Data de criação original (diferente de created_at que é inserção no sistema)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS data_criacao_original date;

-- ============================================
-- 5. METADADOS DE QUALIDADE (Curadoria)
-- Campos: status_curadoria, qualidade_score, vezes_utilizada, taxa_acerto_media, problemas_reportados
-- ============================================

-- Status de curadoria (rascunho, revisao, aprovada, arquivada)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS status_curadoria text CHECK (status_curadoria IN ('rascunho', 'revisao', 'aprovada', 'arquivada')) DEFAULT 'rascunho';

-- Score de qualidade (0-100)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS qualidade_score integer CHECK (qualidade_score >= 0 AND qualidade_score <= 100);

-- Vezes que foi utilizada em simulados
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS vezes_utilizada integer DEFAULT 0;

-- Taxa de acerto média (calculada após tentativas)
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS taxa_acerto_media numeric(5,2);

-- Contador de problemas reportados
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS problemas_reportados integer DEFAULT 0;

-- Feedback agregado dos alunos
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS feedback_agregado jsonb DEFAULT '{}';

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quiz_questions_estilo_enem ON public.quiz_questions(is_estilo_enem) WHERE is_estilo_enem = true;
CREATE INDEX IF NOT EXISTS idx_quiz_questions_tipo_estrutura ON public.quiz_questions(tipo_estrutura);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_demanda_cognitiva ON public.quiz_questions(demanda_cognitiva);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_status_curadoria ON public.quiz_questions(status_curadoria);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_habilidades_gin ON public.quiz_questions USING GIN(habilidades_enem);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_recursos_gin ON public.quiz_questions USING GIN(recursos_visuais);

-- ============================================
-- COMENTÁRIOS DESCRITIVOS
-- ============================================

COMMENT ON COLUMN public.quiz_questions.is_estilo_enem IS 'Flag que indica se a questão segue o padrão ENEM (contextualizada, situação-problema, texto-base)';
COMMENT ON COLUMN public.quiz_questions.tipo_estrutura IS 'Estrutura pedagógica: direta, situacao_problema, interpretacao_texto, analise_dados, estudo_caso';
COMMENT ON COLUMN public.quiz_questions.demanda_cognitiva IS 'Nível de esforço mental: baixa, media, alta, muito_alta';
COMMENT ON COLUMN public.quiz_questions.habilidades_enem IS 'Array de habilidades ENEM (H1-H30) relacionadas à questão';
COMMENT ON COLUMN public.quiz_questions.recursos_visuais IS 'Tipos de recursos: grafico, tabela, imagem, diagrama, formula, mapa';
COMMENT ON COLUMN public.quiz_questions.disciplinas_relacionadas IS 'Disciplinas para questões interdisciplinares';
COMMENT ON COLUMN public.quiz_questions.qualidade_score IS 'Score de 0-100 baseado em revisões e feedback';
COMMENT ON COLUMN public.quiz_questions.questao_pai_id IS 'Referência à questão original se esta for uma adaptação/variação';