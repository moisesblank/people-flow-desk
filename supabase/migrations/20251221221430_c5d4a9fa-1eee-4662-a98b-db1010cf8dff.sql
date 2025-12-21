-- ============================================
-- FIX: Garantir que Owner pode atualizar status de pagamento
-- ============================================

-- Adicionar policy específica para UPDATE do Owner (caso não exista)
DROP POLICY IF EXISTS "owner_update_fixed_expenses" ON public.company_fixed_expenses;
CREATE POLICY "owner_update_fixed_expenses" 
ON public.company_fixed_expenses 
FOR UPDATE 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

DROP POLICY IF EXISTS "owner_update_extra_expenses" ON public.company_extra_expenses;
CREATE POLICY "owner_update_extra_expenses" 
ON public.company_extra_expenses 
FOR UPDATE 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));