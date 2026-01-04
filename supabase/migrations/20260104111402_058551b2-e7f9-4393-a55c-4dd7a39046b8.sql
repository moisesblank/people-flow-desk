-- Permitir lessons sem module_id (para importação em massa de QR Codes Legados)
-- A organização em cursos/módulos será feita posteriormente na interface de gestão

ALTER TABLE public.lessons 
ALTER COLUMN module_id DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.lessons.module_id IS 'Referência ao módulo (area). NULL permitido para aulas importadas via QR Code Legado - organização posterior via gestão.';