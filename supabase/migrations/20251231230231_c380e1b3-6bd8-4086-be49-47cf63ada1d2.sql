-- Corrigir função que estava sem search_path
CREATE OR REPLACE FUNCTION public.update_performance_global_daily_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;