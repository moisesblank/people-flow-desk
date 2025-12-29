-- FIX: Corrigir search_path para função update_system_guard_timestamp
CREATE OR REPLACE FUNCTION public.update_system_guard_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;