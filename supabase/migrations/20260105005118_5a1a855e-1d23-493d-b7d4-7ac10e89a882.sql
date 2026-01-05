-- FASE 1: Adicionar tolerance_minutes na tabela simulados
-- Tolerância em minutos para entrada após o horário de início

ALTER TABLE public.simulados 
ADD COLUMN tolerance_minutes integer NOT NULL DEFAULT 15;

-- Comentário explicativo
COMMENT ON COLUMN public.simulados.tolerance_minutes IS 'Minutos de tolerância para entrada após starts_at. Default: 15 minutos.';