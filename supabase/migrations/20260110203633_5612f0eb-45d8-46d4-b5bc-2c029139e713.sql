-- Adicionar campos de taxonomia à tabela materials
-- Para organização por MACRO e MICRO (5 macros de Química)

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS macro TEXT,
ADD COLUMN IF NOT EXISTS micro TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'outros';

-- Comentários para documentação
COMMENT ON COLUMN public.materials.macro IS 'Macro-assunto da taxonomia (Química Geral, Físico-Química, Química Orgânica, Química Ambiental, Bioquímica)';
COMMENT ON COLUMN public.materials.micro IS 'Micro-assunto associado ao macro';
COMMENT ON COLUMN public.materials.content_type IS 'Tipo de conteúdo: mapa_mental, questoes, resumo, formula, tabela, outros';

-- Criar índices para performance nas buscas
CREATE INDEX IF NOT EXISTS idx_materials_macro ON public.materials(macro);
CREATE INDEX IF NOT EXISTS idx_materials_micro ON public.materials(micro);
CREATE INDEX IF NOT EXISTS idx_materials_content_type ON public.materials(content_type);