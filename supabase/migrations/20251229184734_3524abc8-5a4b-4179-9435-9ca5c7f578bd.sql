
-- Fix search_path para a função validate_expires_at
CREATE OR REPLACE FUNCTION public.validate_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 🎯 SYNAPSE Ω v10.x: expires_at é OPCIONAL para QUALQUER role
  -- NULL = acesso permanente
  -- DATE = expira na data especificada
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
