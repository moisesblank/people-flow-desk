-- P0 FIX: tornar trigger de auditoria resiliente (não depender de NEW.id/OLD.id)
-- Evita falha em DELETE/UPDATE/INSERT quando a tabela não possui coluna id,
-- e evita erro "record NEW has no field id".

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_action TEXT;
  v_record_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_record_id := COALESCE(v_old_data ->> 'id', v_old_data ->> 'uuid');
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      v_action || '_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      v_record_id,
      v_old_data,
      v_new_data,
      jsonb_build_object(
        'trigger_name', TG_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
      ),
      NOW()
    );
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := COALESCE(v_new_data ->> 'id', v_old_data ->> 'id', v_new_data ->> 'uuid', v_old_data ->> 'uuid');
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      v_action || '_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      v_record_id,
      v_old_data,
      v_new_data,
      jsonb_build_object(
        'trigger_name', TG_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
      ),
      NOW()
    );
    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_record_id := COALESCE(v_new_data ->> 'id', v_new_data ->> 'uuid');
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      v_action || '_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      v_record_id,
      v_old_data,
      v_new_data,
      jsonb_build_object(
        'trigger_name', TG_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
      ),
      NOW()
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;