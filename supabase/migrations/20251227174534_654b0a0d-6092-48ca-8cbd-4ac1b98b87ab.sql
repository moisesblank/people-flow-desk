
-- Fix the log_sensitive_access function to handle DELETE correctly
-- The issue is that NEW doesn't exist in DELETE operations, so we need to check TG_OP first

CREATE OR REPLACE FUNCTION public.log_sensitive_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_record_id TEXT;
BEGIN
  -- Get the record ID based on operation type
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id::text;
  ELSE
    v_record_id := COALESCE(NEW.id::text, OLD.id::text);
  END IF;

  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    metadata,
    created_at
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    auth.uid(),
    jsonb_build_object(
      'trigger', 'sensitive_access',
      'timestamp', now()
    ),
    now()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;
