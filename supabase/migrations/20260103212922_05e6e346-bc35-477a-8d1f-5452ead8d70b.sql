-- Adicionar coluna de imagem/thumbnail nos módulos
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Adicionar comentário descritivo
COMMENT ON COLUMN public.modules.thumbnail_url IS 'URL da imagem de capa do módulo (752x940 pixels recomendado)';