-- FIX: Adicionar coluna metadata que está faltando na tabela security_events
-- Erro: column 'metadata' of relation 'security_events' does not exist (code: 42703)
ALTER TABLE public.security_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;