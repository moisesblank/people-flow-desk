-- ============================================
-- FIX: Função SECURITY DEFINER para atualizar status de pagamento
-- Permite que o update funcione mesmo quando RLS é restritiva
-- ============================================

-- Função para atualizar status de gasto fixo
CREATE OR REPLACE FUNCTION public.update_expense_status(
  p_expense_id integer,
  p_expense_type text,
  p_new_status text,
  p_data_pagamento date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_affected_rows integer;
BEGIN
  -- Verificar se o usuário é owner ou admin
  IF NOT (is_owner(auth.uid()) OR is_admin_or_owner(auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permissão negada');
  END IF;

  IF p_expense_type = 'gasto_fixo' THEN
    UPDATE company_fixed_expenses
    SET 
      status_pagamento = p_new_status,
      data_pagamento = CASE WHEN p_new_status = 'pago' THEN COALESCE(p_data_pagamento, CURRENT_DATE) ELSE NULL END,
      updated_at = now()
    WHERE id = p_expense_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
  ELSIF p_expense_type = 'gasto_extra' THEN
    UPDATE company_extra_expenses
    SET 
      status_pagamento = p_new_status,
      data_pagamento = CASE WHEN p_new_status = 'pago' THEN COALESCE(p_data_pagamento, CURRENT_DATE) ELSE NULL END,
      updated_at = now()
    WHERE id = p_expense_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
  ELSIF p_expense_type = 'pagamento' THEN
    UPDATE payments
    SET 
      status = p_new_status,
      data_pagamento = CASE WHEN p_new_status = 'pago' THEN COALESCE(p_data_pagamento, CURRENT_DATE) ELSE NULL END,
      updated_at = now()
    WHERE id = p_expense_id::text::uuid;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de despesa inválido');
  END IF;

  RETURN jsonb_build_object(
    'success', v_affected_rows > 0,
    'affected_rows', v_affected_rows,
    'new_status', p_new_status,
    'expense_type', p_expense_type
  );
END;
$$;