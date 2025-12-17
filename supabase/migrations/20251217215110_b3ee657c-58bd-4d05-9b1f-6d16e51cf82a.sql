-- Permitir que phone seja opcional na tabela whatsapp_leads
ALTER TABLE public.whatsapp_leads ALTER COLUMN phone DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.whatsapp_leads.phone IS 'Telefone do lead (opcional para leads vindos do WordPress sem telefone)';