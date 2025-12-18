-- ============================================
-- CORREÇÃO: Completar tabela transacoes_hotmart_completo
-- ============================================

-- Remover policies existentes (se houver)
DROP POLICY IF EXISTS "transacoes_hotmart_select_admin" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_insert_admin" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_update_admin" ON public.transacoes_hotmart_completo;
DROP POLICY IF EXISTS "transacoes_hotmart_delete_admin" ON public.transacoes_hotmart_completo;

-- Criar policies RLS
CREATE POLICY "transacoes_hotmart_select_admin" ON public.transacoes_hotmart_completo
  FOR SELECT USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "transacoes_hotmart_insert_service" ON public.transacoes_hotmart_completo
  FOR INSERT WITH CHECK (true);

CREATE POLICY "transacoes_hotmart_update_admin" ON public.transacoes_hotmart_completo
  FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "transacoes_hotmart_delete_owner" ON public.transacoes_hotmart_completo
  FOR DELETE USING (public.is_owner(auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_transacoes_hotmart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_transacoes_hotmart_updated_at ON public.transacoes_hotmart_completo;
CREATE TRIGGER trigger_transacoes_hotmart_updated_at
  BEFORE UPDATE ON public.transacoes_hotmart_completo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transacoes_hotmart_updated_at();

-- Habilitar Realtime (ignorar se já existir)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_hotmart_completo;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Criar função para inserir/atualizar transações (SECURITY DEFINER para bypass RLS em webhooks)
CREATE OR REPLACE FUNCTION public.upsert_hotmart_transaction(
  p_transaction_id TEXT,
  p_product_id TEXT DEFAULT NULL,
  p_product_name TEXT DEFAULT NULL,
  p_buyer_email TEXT DEFAULT NULL,
  p_buyer_name TEXT DEFAULT NULL,
  p_buyer_phone TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending',
  p_valor_bruto NUMERIC DEFAULT 0,
  p_metodo_pagamento TEXT DEFAULT NULL,
  p_parcelas INTEGER DEFAULT 1,
  p_affiliate_name TEXT DEFAULT NULL,
  p_affiliate_id TEXT DEFAULT NULL,
  p_data_compra TIMESTAMPTZ DEFAULT NULL,
  p_hotmart_event TEXT DEFAULT NULL,
  p_webhook_raw JSONB DEFAULT NULL,
  p_subscription_id TEXT DEFAULT NULL,
  p_offer_code TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_commission_value NUMERIC DEFAULT NULL,
  p_is_subscription BOOLEAN DEFAULT false,
  p_recurrence_number INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.transacoes_hotmart_completo (
    transaction_id, product_id, product_name, buyer_email, buyer_name,
    buyer_phone, status, valor_bruto, metodo_pagamento, parcelas,
    affiliate_name, affiliate_id, data_compra, hotmart_event, webhook_raw,
    subscription_id, offer_code, coupon_code, commission_value,
    is_subscription, recurrence_number, processed, processed_at
  ) VALUES (
    p_transaction_id, p_product_id, p_product_name, p_buyer_email, p_buyer_name,
    p_buyer_phone, p_status, p_valor_bruto, p_metodo_pagamento, p_parcelas,
    p_affiliate_name, p_affiliate_id, p_data_compra, p_hotmart_event, p_webhook_raw,
    p_subscription_id, p_offer_code, p_coupon_code, p_commission_value,
    p_is_subscription, p_recurrence_number, TRUE, NOW()
  )
  ON CONFLICT (transaction_id) DO UPDATE SET
    status = EXCLUDED.status,
    valor_bruto = COALESCE(EXCLUDED.valor_bruto, transacoes_hotmart_completo.valor_bruto),
    hotmart_event = EXCLUDED.hotmart_event,
    webhook_raw = EXCLUDED.webhook_raw,
    data_confirmacao = CASE WHEN EXCLUDED.status IN ('approved', 'purchase_approved', 'purchase_complete') THEN NOW() ELSE transacoes_hotmart_completo.data_confirmacao END,
    data_cancelamento = CASE WHEN EXCLUDED.status IN ('canceled', 'purchase_canceled', 'refunded', 'chargeback') THEN NOW() ELSE transacoes_hotmart_completo.data_cancelamento END,
    processed = TRUE,
    processed_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Grant para função ser chamada por service role
GRANT EXECUTE ON FUNCTION public.upsert_hotmart_transaction TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_hotmart_transaction TO authenticated;