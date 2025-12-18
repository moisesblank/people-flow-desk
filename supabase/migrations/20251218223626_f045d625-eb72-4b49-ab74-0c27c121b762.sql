-- v19: Limpeza e padronização de RLS (remover policies duplicadas/"public" e manter regras estritas)

-- AFFILIATES (dados financeiros)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='affiliates'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.affiliates', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "affiliates_select_admin_owner"
ON public.affiliates
FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "affiliates_manage_owner_only"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "affiliates_update_owner_only"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "affiliates_delete_owner_only"
ON public.affiliates
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));


-- TRANSAÇÕES HOTMART COMPLETO (CPF/PII)
ALTER TABLE public.transacoes_hotmart_completo ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='transacoes_hotmart_completo'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.transacoes_hotmart_completo', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "hotmart_select_admin_owner"
ON public.transacoes_hotmart_completo
FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- Inserções são feitas por rotinas backend (service role ignora RLS). Mantemos apenas owner para inserção direta.
CREATE POLICY "hotmart_insert_owner_only"
ON public.transacoes_hotmart_completo
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "hotmart_update_owner_only"
ON public.transacoes_hotmart_completo
FOR UPDATE
TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "hotmart_delete_owner_only"
ON public.transacoes_hotmart_completo
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));


-- WOOCOMMERCE ORDERS (dados de compra)
ALTER TABLE public.woocommerce_orders ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='woocommerce_orders'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.woocommerce_orders', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "woo_orders_select_admin_owner"
ON public.woocommerce_orders
FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "woo_orders_insert_owner_only"
ON public.woocommerce_orders
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "woo_orders_update_owner_only"
ON public.woocommerce_orders
FOR UPDATE
TO authenticated
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "woo_orders_delete_owner_only"
ON public.woocommerce_orders
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));


-- TRANSACTIONS (movimentações financeiras unificadas)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', p.policyname);
  END LOOP;
END $$;

-- Leitura: usuário vê o que ele criou; time financeiro (admin/owner/contabilidade) vê dados não pessoais; owner vê pessoais.
CREATE POLICY "transactions_select_strict"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  (created_by = auth.uid())
  OR (
    is_personal = false
    AND public.can_view_financial(auth.uid())
  )
  OR (
    is_personal = true
    AND public.is_owner(auth.uid())
  )
);

-- Inserção: deve ser do próprio usuário; se pessoal=true, somente owner.
CREATE POLICY "transactions_insert_strict"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  (created_by = auth.uid())
  AND (
    (is_personal = false)
    OR (is_personal = true AND public.is_owner(auth.uid()))
  )
);

-- Atualização: quem criou pode atualizar não pessoal; pessoal só owner. Time financeiro pode atualizar não pessoal.
CREATE POLICY "transactions_update_strict"
ON public.transactions
FOR UPDATE
TO authenticated
USING (
  (
    is_personal = false
    AND (created_by = auth.uid() OR public.can_view_financial(auth.uid()))
  )
  OR (is_personal = true AND public.is_owner(auth.uid()))
)
WITH CHECK (
  (
    is_personal = false
    AND (created_by = auth.uid() OR public.can_view_financial(auth.uid()))
  )
  OR (is_personal = true AND public.is_owner(auth.uid()))
);

-- Delete: time financeiro pode deletar não pessoal; pessoal só owner.
CREATE POLICY "transactions_delete_strict"
ON public.transactions
FOR DELETE
TO authenticated
USING (
  (is_personal = false AND public.can_view_financial(auth.uid()))
  OR (is_personal = true AND public.is_owner(auth.uid()))
);


-- PAYMENT_TRANSACTIONS (metadados de pagamento)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='payment_transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_transactions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "payment_transactions_select"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "payment_transactions_insert_own"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_transactions_update_admin"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "payment_transactions_delete_admin"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));


-- USER_MFA_SETTINGS (segredos 2FA)
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_mfa_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_mfa_settings', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "mfa_select_own"
ON public.user_mfa_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "mfa_insert_own"
ON public.user_mfa_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "mfa_update_own"
ON public.user_mfa_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "mfa_delete_own"
ON public.user_mfa_settings
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
