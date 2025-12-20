
-- Corrigir trigger com valores corretos de prioridade (normal, not medium)
CREATE OR REPLACE FUNCTION public.fn_sync_expense_to_calendar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task_title text;
  v_task_date date;
  v_expense_type text;
  v_task_id uuid;
BEGIN
  v_expense_type := CASE TG_TABLE_NAME 
    WHEN 'company_fixed_expenses' THEN 'Fixo'
    WHEN 'company_extra_expenses' THEN 'Extra'
    ELSE 'Empresa'
  END;
  
  v_task_date := COALESCE(NEW.data_vencimento, CURRENT_DATE);
  v_task_title := '💰 PAGAR: ' || NEW.nome || ' - R$ ' || ROUND(NEW.valor::numeric / 100, 2)::text || ' - ' || v_expense_type;
  
  IF NEW.status_pagamento = 'pago' THEN
    UPDATE public.calendar_tasks 
    SET is_completed = true, updated_at = now()
    WHERE title LIKE '%PAGAR: ' || OLD.nome || '%'
      AND is_completed = false;
    RETURN NEW;
  END IF;
  
  IF NEW.status_pagamento IN ('pendente', 'atrasado') THEN
    SELECT id INTO v_task_id
    FROM public.calendar_tasks
    WHERE title LIKE '%PAGAR: ' || NEW.nome || '%'
      AND is_completed = false
    LIMIT 1;
    
    IF v_task_id IS NOT NULL THEN
      UPDATE public.calendar_tasks
      SET 
        title = v_task_title,
        task_date = v_task_date,
        priority = CASE WHEN NEW.status_pagamento = 'atrasado' THEN 'urgent' ELSE 'normal' END,
        updated_at = now()
      WHERE id = v_task_id;
    ELSE
      INSERT INTO public.calendar_tasks (
        title, description, task_date, category, priority, user_id, reminder_enabled
      )
      SELECT
        v_task_title,
        'Gasto ' || v_expense_type || ' - ' || COALESCE(NEW.categoria, 'Sem categoria'),
        v_task_date,
        'financeiro',
        CASE WHEN NEW.status_pagamento = 'atrasado' THEN 'urgent' ELSE 'normal' END,
        ur.user_id,
        true
      FROM public.user_roles ur
      WHERE ur.role = 'owner'
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
