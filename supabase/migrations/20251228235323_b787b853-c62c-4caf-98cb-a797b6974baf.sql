
-- ============================================
-- ADICIONAR COLUNA tipo_produto NA TABELA alunos
-- Para diferenciar Alunos Online - Livroweb vs Físico
-- ============================================

-- Adicionar coluna tipo_produto (nullable, pois alunos antigos não têm)
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS tipo_produto TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_alunos_tipo_produto ON public.alunos(tipo_produto);

-- Comentário explicativo
COMMENT ON COLUMN public.alunos.tipo_produto IS 'Tipo de produto Hotmart: livroweb (ID 6585429) ou fisico (ID 6656573)';
