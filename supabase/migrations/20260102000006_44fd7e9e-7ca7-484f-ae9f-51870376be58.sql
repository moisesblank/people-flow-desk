-- ============================================
-- LOGS CLEANUP 48H - Aniquilação automática v2
-- Muda de 7 dias para 48 horas
-- ============================================

-- Primeiro dropar a função antiga
DROP FUNCTION IF EXISTS public.cleanup_old_logs();

-- Criar função de limpeza para 48 horas
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.system_realtime_logs 
    WHERE created_at < now() - interval '48 hours'
    RETURNING *
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Criar função para limpeza automática via trigger
CREATE OR REPLACE FUNCTION public.auto_cleanup_logs_48h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A cada inserção, se tiver muitos logs, executar limpeza
  IF (SELECT count(*) FROM public.system_realtime_logs) > 1000 THEN
    PERFORM public.cleanup_old_logs();
  END IF;
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_auto_cleanup_logs ON public.system_realtime_logs;

-- Criar trigger que executa limpeza periodicamente
CREATE TRIGGER trigger_auto_cleanup_logs
  AFTER INSERT ON public.system_realtime_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.auto_cleanup_logs_48h();

-- Executar limpeza inicial
SELECT public.cleanup_old_logs();