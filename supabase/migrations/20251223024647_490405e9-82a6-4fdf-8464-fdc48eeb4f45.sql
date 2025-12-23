-- ============================================
-- 🛡️ FORTALEZA DIGITAL — FASE 1: CORREÇÃO RLS CRÍTICA
-- Remove policies permissivas (USING true) das tabelas financeiras
-- Mantém apenas policies seguras existentes (owner, finance)
-- ============================================

-- ==== FOLHA_PAGAMENTO (SALÁRIOS) ====
-- Remover policies permissivas
DROP POLICY IF EXISTS "Authenticated users can view folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Authenticated users can insert folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Authenticated users can update folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Authenticated users can delete folha_pagamento" ON public.folha_pagamento;

-- ==== CONTAS_PAGAR ====
DROP POLICY IF EXISTS "Authenticated users can view contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated users can insert contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated users can update contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated users can delete contas_pagar" ON public.contas_pagar;

-- ==== CONTAS_RECEBER ====
DROP POLICY IF EXISTS "Authenticated users can view contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated users can insert contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated users can update contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated users can delete contas_receber" ON public.contas_receber;

-- ==== FLUXO_CAIXA ====
DROP POLICY IF EXISTS "Authenticated users can view fluxo_caixa" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Authenticated users can insert fluxo_caixa" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Authenticated users can update fluxo_caixa" ON public.fluxo_caixa;

-- Criar policy segura para fluxo_caixa (não tinha *_finance)
CREATE POLICY "fluxo_caixa_select_finance"
ON public.fluxo_caixa FOR SELECT
TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "fluxo_caixa_insert_finance"
ON public.fluxo_caixa FOR INSERT
TO authenticated
WITH CHECK (public.can_view_financial(auth.uid()));

CREATE POLICY "fluxo_caixa_update_finance"
ON public.fluxo_caixa FOR UPDATE
TO authenticated
USING (public.can_view_financial(auth.uid()));

CREATE POLICY "fluxo_caixa_delete_owner"
ON public.fluxo_caixa FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- ==== PONTO_ELETRONICO ====
DROP POLICY IF EXISTS "Authenticated users can view ponto_eletronico" ON public.ponto_eletronico;
DROP POLICY IF EXISTS "Authenticated users can insert ponto_eletronico" ON public.ponto_eletronico;
DROP POLICY IF EXISTS "Authenticated users can update ponto_eletronico" ON public.ponto_eletronico;
DROP POLICY IF EXISTS "Authenticated users can delete ponto_eletronico" ON public.ponto_eletronico;

-- Criar policies seguras para ponto_eletronico
-- Funcionários podem ver/inserir próprio ponto
CREATE POLICY "ponto_eletronico_select_own"
ON public.ponto_eletronico FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "ponto_eletronico_insert_own"
ON public.ponto_eletronico FOR INSERT
TO authenticated
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "ponto_eletronico_update_admin"
ON public.ponto_eletronico FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "ponto_eletronico_delete_owner"
ON public.ponto_eletronico FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- ==== ARQUIVOS (tabela de metadados) ====
DROP POLICY IF EXISTS "Authenticated can read arquivos metadata" ON public.arquivos;
DROP POLICY IF EXISTS "Authenticated can insert arquivos metadata" ON public.arquivos;
DROP POLICY IF EXISTS "Authenticated can update arquivos metadata" ON public.arquivos;
DROP POLICY IF EXISTS "Authenticated can delete arquivos metadata" ON public.arquivos;

-- Criar policies seguras para arquivos
CREATE POLICY "arquivos_select_own_or_admin"
ON public.arquivos FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "arquivos_insert_authenticated"
ON public.arquivos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "arquivos_update_own_or_admin"
ON public.arquivos FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "arquivos_delete_own_or_admin"
ON public.arquivos FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin_or_owner(auth.uid())
);

-- ==== AUDIT LOG: Registrar esta mudança ====
INSERT INTO public.security_audit_log (
  user_id,
  action,
  action_category,
  table_name,
  severity,
  metadata
) VALUES (
  NULL,
  'FORTALEZA_DIGITAL_PHASE1',
  'security_hardening',
  'multiple',
  'critical',
  jsonb_build_object(
    'description', 'Removed permissive RLS policies (USING true) from financial tables',
    'tables_affected', ARRAY['folha_pagamento', 'contas_pagar', 'contas_receber', 'fluxo_caixa', 'ponto_eletronico', 'arquivos'],
    'policies_removed', 18,
    'policies_created', 12,
    'executed_at', now()
  )
);