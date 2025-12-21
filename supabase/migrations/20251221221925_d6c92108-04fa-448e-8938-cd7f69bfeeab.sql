-- Corrigir função update_expense_status para usar timestamp em vez de date
DROP FUNCTION IF EXISTS public.update_expense_status(integer, text, text, date);

CREATE OR REPLACE FUNCTION public.update_expense_status(
  p_expense_id integer,
  p_expense_type text,
  p_new_status text,
  p_data_pagamento text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_affected_rows integer;
  v_data_pag timestamp with time zone;
BEGIN
  -- Verificar se o usuário é owner ou admin
  IF NOT (is_owner(auth.uid()) OR is_admin_or_owner(auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permissão negada');
  END IF;

  -- Converter data se fornecida
  IF p_data_pagamento IS NOT NULL THEN
    v_data_pag := p_data_pagamento::timestamp with time zone;
  ELSE
    v_data_pag := NOW();
  END IF;

  IF p_expense_type = 'gasto_fixo' THEN
    UPDATE company_fixed_expenses
    SET 
      status_pagamento = p_new_status,
      data_pagamento = CASE WHEN p_new_status = 'pago' THEN v_data_pag ELSE NULL END,
      updated_at = now()
    WHERE id = p_expense_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
  ELSIF p_expense_type = 'gasto_extra' THEN
    UPDATE company_extra_expenses
    SET 
      status_pagamento = p_new_status,
      data_pagamento = CASE WHEN p_new_status = 'pago' THEN v_data_pag ELSE NULL END,
      updated_at = now()
    WHERE id = p_expense_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
  ELSIF p_expense_type = 'pagamento' THEN
    UPDATE payments
    SET 
      status = p_new_status,
      data_pagamento = CASE WHEN p_new_status = 'pago' THEN v_data_pag ELSE NULL END,
      updated_at = now()
    WHERE id = p_expense_id::text::uuid;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de despesa inválido: ' || p_expense_type);
  END IF;

  IF v_affected_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Nenhum registro encontrado com ID: ' || p_expense_id || ' do tipo ' || p_expense_type,
      'affected_rows', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'affected_rows', v_affected_rows,
    'new_status', p_new_status,
    'expense_type', p_expense_type,
    'expense_id', p_expense_id
  );
END;
$$;