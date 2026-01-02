-- Adicionar coluna faltante na tabela system_realtime_logs
ALTER TABLE public.system_realtime_logs 
ADD COLUMN IF NOT EXISTS affected_url_or_area TEXT;