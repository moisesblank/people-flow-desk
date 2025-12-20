
-- Corrigir trigger que está causando erro
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
  -- Determinar tipo de gasto
  v_expense_type := CASE TG_TABLE_NAME 
    WHEN 'company_fixed_expenses' THEN 'Fixo'
    WHEN 'company_extra_expenses' THEN 'Extra'
    ELSE 'Empresa'
  END;
  
  -- Definir data (vencimento ou data atual) - corrigido para não usar campo 'data'
  v_task_date := COALESCE(NEW.data_vencimento, CURRENT_DATE);
  
  -- Título da tarefa
  v_task_title := '💰 PAGAR: ' || NEW.nome || ' (R$ ' || (NEW.valor::numeric / 100)::text || ') - ' || v_expense_type;
  
  -- Se status mudou para PAGO, remover/completar tarefa do calendário
  IF NEW.status_pagamento = 'pago' THEN
    UPDATE public.calendar_tasks 
    SET is_completed = true, updated_at = now()
    WHERE title LIKE '%PAGAR: ' || OLD.nome || '%'
      AND is_completed = false;
      
    RETURN NEW;
  END IF;
  
  -- Se status é pendente ou atrasado, criar/atualizar tarefa
  IF NEW.status_pagamento IN ('pendente', 'atrasado') THEN
    -- Verificar se já existe tarefa não completada para este gasto
    SELECT id INTO v_task_id
    FROM public.calendar_tasks
    WHERE title LIKE '%PAGAR: ' || NEW.nome || '%'
      AND is_completed = false
    LIMIT 1;
    
    IF v_task_id IS NOT NULL THEN
      -- Atualizar tarefa existente
      UPDATE public.calendar_tasks
      SET 
        title = v_task_title,
        task_date = v_task_date,
        priority = CASE WHEN NEW.status_pagamento = 'atrasado' THEN 'alta' ELSE 'media' END,
        updated_at = now()
      WHERE id = v_task_id;
    ELSE
      -- Criar nova tarefa apenas se tiver owner
      INSERT INTO public.calendar_tasks (
        title, 
        description, 
        task_date, 
        category, 
        priority, 
        user_id,
        reminder_enabled
      )
      SELECT
        v_task_title,
        'Gasto ' || v_expense_type || ' - Categoria: ' || COALESCE(NEW.categoria, 'Não definida'),
        v_task_date,
        'financeiro',
        CASE WHEN NEW.status_pagamento = 'atrasado' THEN 'alta' ELSE 'media' END,
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
