-- CORREÇÃO: Atualizar funções que ainda acessam auth.users diretamente

-- 1. Corrigir can_access_attachment para usar current_user_email()
CREATE OR REPLACE FUNCTION public.can_access_attachment(p_entity_type text, p_entity_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_owner(auth.uid()) THEN RETURN TRUE; END IF;
  
  CASE p_entity_type
    WHEN 'task' THEN
      RETURN EXISTS (SELECT 1 FROM public.calendar_tasks WHERE id::TEXT = p_entity_id AND user_id = auth.uid());
    WHEN 'aluno' THEN
      RETURN EXISTS (SELECT 1 FROM public.alunos WHERE id::TEXT = p_entity_id AND email = public.current_user_email());
    ELSE
      RETURN public.is_admin_or_owner(auth.uid());
  END CASE;
END;
$function$;

-- 2. Corrigir log_activity para usar current_user_email()
CREATE OR REPLACE FUNCTION public.log_activity(_action text, _table_name text DEFAULT NULL::text, _record_id text DEFAULT NULL::text, _old_value jsonb DEFAULT NULL::jsonb, _new_value jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  _log_id UUID;
  _user_email TEXT;
BEGIN
  _user_email := public.current_user_email();
  
  INSERT INTO public.activity_log (user_id, user_email, action, table_name, record_id, old_value, new_value)
  VALUES (auth.uid(), _user_email, _action, _table_name, _record_id, _old_value, _new_value)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$function$;