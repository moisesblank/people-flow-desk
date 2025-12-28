-- Fix: Function Search Path Mutable
CREATE OR REPLACE FUNCTION public.update_envios_correios_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;