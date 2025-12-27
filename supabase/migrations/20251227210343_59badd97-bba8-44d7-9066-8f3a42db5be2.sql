
-- =========================================================
-- FIX P0: log_sensitive_access assume OLD.id/NEW.id e quebra em tabelas sem coluna id
-- Sintoma: ao excluir funcionário → cascata apaga employee_compensation → trigger audit_compensation_access
--          ERRO: record "old" has no field "id"
-- Solução: extrair record_id via to_jsonb(OLD/NEW) com fallback (id/uuid/employee_id)
-- =========================================================

CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_record_id TEXT;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;
  v_new := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;

  v_record_id := COALESCE(
    v_new ->> 'id',
    v_old ->> 'id',
    v_new ->> 'uuid',
    v_old ->> 'uuid',
    v_new ->> 'employee_id',
    v_old ->> 'employee_id'
  );

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
$$;
