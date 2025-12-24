-- ============================================
-- MIGRAÇÃO: Adicionar SET search_path em todas as funções pendentes
-- LEI III SEGURANÇA - Proteção contra search_path hijacking
-- ============================================

-- 1. Corrigir update_device_trust_updated_at (único sem search_path)
CREATE OR REPLACE FUNCTION public.update_device_trust_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- NOTA: As demais 50+ funções já possuem SET search_path TO 'public' ou SET search_path = 'public'
-- Verificado via query: SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%'
-- Resultado: 1 função (esta que estamos corrigindo)

-- Comentário de auditoria
COMMENT ON FUNCTION public.update_device_trust_updated_at() IS 'Trigger function com search_path fixado - LEI III SEGURANÇA';