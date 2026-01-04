
-- Adicionar coluna subcategory à tabela modules
-- Essa coluna representa o nível de agrupamento intermediário entre curso e módulo
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Criar índice para melhorar performance de queries por subcategory
CREATE INDEX IF NOT EXISTS idx_modules_subcategory ON public.modules(subcategory);

-- Criar índice composto para ordenação correta
CREATE INDEX IF NOT EXISTS idx_modules_course_subcategory_position ON public.modules(course_id, subcategory, position);

-- Comentário para documentação
COMMENT ON COLUMN public.modules.subcategory IS 'Agrupador intermediário dentro do curso (ex: Resoluções, Teoria, Revisão)';
