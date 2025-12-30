-- PATCH-ONLY: Corrigir inserts em public.security_events quando source vier NULL
-- Mantém lógica existente: apenas aplica default server-side (evita erro 23502)

-- Garantir default no schema (para inserts que omitirem a coluna)
ALTER TABLE public.security_events
  ALTER COLUMN source SET DEFAULT 'system';

-- Para casos onde o código envia NULL explicitamente, usar trigger de saneamento
CREATE OR REPLACE FUNCTION public.fn_security_events_sanitize_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.source IS NULL OR NEW.source = '' THEN
    NEW.source := 'system';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_security_events_sanitize_defaults'
  ) THEN
    CREATE TRIGGER trg_security_events_sanitize_defaults
    BEFORE INSERT ON public.security_events
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_security_events_sanitize_defaults();
  END IF;
END $$;