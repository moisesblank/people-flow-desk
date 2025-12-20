-- ============================================
-- Adicionar status de pagamento e data de vencimento aos gastos da empresa
-- Integração com calendário para alertas em tempo real
-- ============================================

-- 1. Adicionar colunas de status de pagamento às tabelas de gastos
ALTER TABLE public.company_fixed_expenses 
  ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone,
  ADD COLUMN IF NOT EXISTS observacoes_pagamento text;

ALTER TABLE public.company_extra_expenses 
  ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone,
  ADD COLUMN IF NOT EXISTS observacoes_pagamento text;

-- 2. Criar índices para consultas por status
CREATE INDEX IF NOT EXISTS idx_company_fixed_expenses_status ON public.company_fixed_expenses(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_status ON public.company_extra_expenses(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_company_fixed_expenses_vencimento ON public.company_fixed_expenses(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_company_extra_expenses_vencimento ON public.company_extra_expenses(data_vencimento);

-- 3. Função para criar/atualizar tarefa no calendário quando gasto não pago
CREATE OR REPLACE FUNCTION public.fn_sync_expense_to_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Definir data (vencimento ou data atual)
  v_task_date := COALESCE(NEW.data_vencimento, NEW.data, CURRENT_DATE);
  
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
$$;

-- 4. Criar triggers para sincronizar com calendário
DROP TRIGGER IF EXISTS trg_sync_fixed_expense_calendar ON public.company_fixed_expenses;
CREATE TRIGGER trg_sync_fixed_expense_calendar
  AFTER INSERT OR UPDATE OF status_pagamento, data_vencimento, nome, valor
  ON public.company_fixed_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_expense_to_calendar();

DROP TRIGGER IF EXISTS trg_sync_extra_expense_calendar ON public.company_extra_expenses;
CREATE TRIGGER trg_sync_extra_expense_calendar
  AFTER INSERT OR UPDATE OF status_pagamento, data_vencimento, nome, valor
  ON public.company_extra_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_expense_to_calendar();

-- 5. Função para verificar e atualizar gastos atrasados automaticamente
CREATE OR REPLACE FUNCTION public.fn_check_overdue_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar gastos fixos atrasados
  UPDATE public.company_fixed_expenses
  SET status_pagamento = 'atrasado'
  WHERE status_pagamento = 'pendente'
    AND data_vencimento < CURRENT_DATE;
    
  -- Atualizar gastos extras atrasados
  UPDATE public.company_extra_expenses
  SET status_pagamento = 'atrasado'
  WHERE status_pagamento = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END;
$$;

-- 6. Criar alerta no sistema quando gasto fica atrasado
CREATE OR REPLACE FUNCTION public.fn_alert_overdue_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status_pagamento = 'atrasado' AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'atrasado') THEN
    INSERT INTO public.alertas_sistema (
      tipo, titulo, mensagem, origem, destinatarios, dados
    )
    VALUES (
      'financeiro',
      '⚠️ Gasto Atrasado: ' || NEW.nome,
      'O gasto "' || NEW.nome || '" no valor de R$ ' || (NEW.valor::numeric / 100)::text || ' está atrasado!',
      TG_TABLE_NAME,
      '["owner", "admin"]'::jsonb,
      jsonb_build_object(
        'expense_id', NEW.id,
        'expense_name', NEW.nome,
        'valor', NEW.valor,
        'data_vencimento', NEW.data_vencimento
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_fixed_expense_overdue ON public.company_fixed_expenses;
CREATE TRIGGER trg_alert_fixed_expense_overdue
  AFTER UPDATE OF status_pagamento
  ON public.company_fixed_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_alert_overdue_expense();

DROP TRIGGER IF EXISTS trg_alert_extra_expense_overdue ON public.company_extra_expenses;
CREATE TRIGGER trg_alert_extra_expense_overdue
  AFTER UPDATE OF status_pagamento
  ON public.company_extra_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_alert_overdue_expense();