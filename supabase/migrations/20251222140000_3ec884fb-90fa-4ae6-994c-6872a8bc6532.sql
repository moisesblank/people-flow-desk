
-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.protect_privilege_escalation_v3()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        IF NOT public.is_owner(auth.uid()) THEN
            PERFORM public.log_security_v3('privilege_escalation_attempt', auth.uid(), 'critical', 
                jsonb_build_object('target', NEW.user_id, 'attempted', NEW.role, 'original', OLD.role));
            RAISE EXCEPTION 'PRIVILEGE ESCALATION BLOCKED';
        END IF;
        PERFORM public.log_security_v3('role_changed', NEW.user_id, 'warning',
            jsonb_build_object('by', auth.uid(), 'from', OLD.role, 'to', NEW.role));
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_log_deletion_v3()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY: Audit logs cannot be deleted';
    RETURN NULL;
END;
$$;
