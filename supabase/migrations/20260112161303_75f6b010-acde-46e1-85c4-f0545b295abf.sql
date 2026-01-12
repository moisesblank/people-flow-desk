-- Adicionar preview_status à tabela materials
-- O campo cover_url já existe e será usado para o preview

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS preview_status TEXT DEFAULT 'pending' 
CHECK (preview_status IN ('pending', 'processing', 'ready', 'error', 'skipped'));

-- Marcar materiais que já têm cover como 'ready'
UPDATE public.materials 
SET preview_status = 'ready' 
WHERE cover_url IS NOT NULL AND cover_url != '';

-- Index para backfill
CREATE INDEX IF NOT EXISTS idx_materials_preview_status 
ON public.materials(preview_status) 
WHERE preview_status = 'pending';