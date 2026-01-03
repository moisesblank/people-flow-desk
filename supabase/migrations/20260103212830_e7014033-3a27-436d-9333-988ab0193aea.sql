-- Adicionar coluna de imagem/thumbnail nos módulos (areas)
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Adicionar comentário descritivo
COMMENT ON COLUMN public.areas.thumbnail_url IS 'URL da imagem de capa do módulo (752x940 pixels recomendado)';