-- ============================================
-- P0 FIX: Adicionar cache_epoch ao system_guard
-- Permite limpeza automática de cache a cada 24h
-- ============================================

-- Adicionar coluna cache_epoch (inicializa em 1)
ALTER TABLE public.system_guard 
ADD COLUMN IF NOT EXISTS cache_epoch INTEGER DEFAULT 1;

-- Adicionar coluna last_cache_clear_at para auditoria
ALTER TABLE public.system_guard 
ADD COLUMN IF NOT EXISTS last_cache_clear_at TIMESTAMPTZ;

-- Atualizar registro existente
UPDATE public.system_guard 
SET cache_epoch = 1, 
    last_cache_clear_at = NOW() 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Criar função para incrementar cache_epoch (usada pelo cron)
CREATE OR REPLACE FUNCTION public.increment_cache_epoch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.system_guard 
  SET cache_epoch = cache_epoch + 1,
      last_cache_clear_at = NOW(),
      updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Log para auditoria
  INSERT INTO public.audit_logs (action, table_name, metadata)
  VALUES ('cache_epoch_increment', 'system_guard', jsonb_build_object(
    'triggered_by', 'cron_daily',
    'timestamp', NOW()
  ));
END;
$$;

-- Conceder permissão para edge functions chamarem a função
GRANT EXECUTE ON FUNCTION public.increment_cache_epoch() TO service_role;