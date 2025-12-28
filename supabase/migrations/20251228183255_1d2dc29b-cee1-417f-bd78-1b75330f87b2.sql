
-- ============================================
-- FIX: protect_privilege_escalation_v3
-- Permite operações via Service Role Key (auth.uid() = NULL)
-- CONSTITUIÇÃO v10.x - PATCH-ONLY
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_privilege_escalation_v3()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    caller_uid uuid;
BEGIN
    -- Obter caller uid
    caller_uid := auth.uid();
    
    -- Se caller_uid é NULL, é uma operação via Service Role Key (admin)
    -- Service Role Key é usado por Edge Functions autorizadas
    -- Neste caso, PERMITIR a operação (já foi validada na Edge Function)
    IF caller_uid IS NULL THEN
        -- Log da operação administrativa
        INSERT INTO audit_logs (action, table_name, record_id, new_data, metadata)
        VALUES (
            'ADMIN_ROLE_CHANGE',
            'user_roles',
            NEW.user_id::text,
            jsonb_build_object('role', NEW.role, 'previous_role', OLD.role),
            jsonb_build_object('via', 'service_role_key', 'trigger', 'protect_privilege_escalation_v3')
        );
        RETURN NEW;
    END IF;
    
    -- Verificar mudança de role (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        -- Apenas owner pode alterar roles via cliente
        IF NOT public.is_owner(caller_uid) THEN
            PERFORM public.log_security_v3('privilege_escalation_attempt', caller_uid, 'critical', 
                jsonb_build_object('target', NEW.user_id, 'attempted', NEW.role, 'original', OLD.role));
            RAISE EXCEPTION 'PRIVILEGE ESCALATION BLOCKED';
        END IF;
        
        -- Log da mudança autorizada
        PERFORM public.log_security_v3('role_changed', NEW.user_id, 'warning',
            jsonb_build_object('by', caller_uid, 'from', OLD.role, 'to', NEW.role));
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Comentário explicativo
COMMENT ON FUNCTION public.protect_privilege_escalation_v3() IS 
'Protege contra escalonamento de privilégios. Permite operações via Service Role Key (Edge Functions autorizadas). v3.1 - Fix NULL auth.uid()';
