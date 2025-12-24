
-- ============================================
-- CORREÇÃO SEGURANÇA v17.0 - BLOCO 11 FINAL
-- 3 issues identificadas pelo Security Scanner
-- ============================================

-- ============================================
-- CORREÇÃO 1: affiliates_safe - Adicionar SECURITY INVOKER
-- (Resolve: security_definer_view ERROR)
-- ============================================

DROP VIEW IF EXISTS public.affiliates_safe;

CREATE VIEW public.affiliates_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  email,
  telefone,
  whatsapp,
  cupom,
  link_afiliado,
  status,
  total_vendas,
  total_comissao,
  comissao_total,
  percentual_comissao,
  taxa_comissao,
  hotmart_id,
  parceiro_aluno,
  user_id,
  created_at,
  CASE
    WHEN (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.email = 'moisesblank@gmail.com')) 
    THEN banco
    ELSE COALESCE(LEFT(banco, 3) || '***', 'OCULTO')
  END AS banco,
  CASE
    WHEN (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.email = 'moisesblank@gmail.com')) 
    THEN agencia
    ELSE COALESCE(LEFT(agencia, 2) || '**', 'OCULTO')
  END AS agencia,
  CASE
    WHEN (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.email = 'moisesblank@gmail.com')) 
    THEN conta
    ELSE COALESCE(LEFT(conta, 2) || '****', 'OCULTO')
  END AS conta,
  CASE
    WHEN (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.email = 'moisesblank@gmail.com')) 
    THEN pix
    ELSE 'OCULTO'
  END AS pix
FROM affiliates;

GRANT SELECT ON public.affiliates_safe TO authenticated;

-- ============================================
-- CORREÇÃO 2: device_trust_scores - Restringir acesso
-- (Resolve: device_trust_scores_public ERROR)
-- ============================================

DROP POLICY IF EXISTS "System can manage all device trust scores" ON public.device_trust_scores;

DROP POLICY IF EXISTS "Users can insert own device trust scores" ON public.device_trust_scores;
CREATE POLICY "Users can insert own device trust scores"
ON public.device_trust_scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own device trust scores" ON public.device_trust_scores;
CREATE POLICY "Users can update own device trust scores"
ON public.device_trust_scores
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all device trust scores" ON public.device_trust_scores;
CREATE POLICY "Admins can manage all device trust scores"
ON public.device_trust_scores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('owner', 'admin')
  )
);

-- ============================================
-- CORREÇÃO 3: editable_content - Limpar duplicatas
-- (Resolve: editable_content_modification WARN)
-- ============================================

DROP POLICY IF EXISTS "Owner can manage editable content" ON public.editable_content;
DROP POLICY IF EXISTS "editable_content_admin_write" ON public.editable_content;
DROP POLICY IF EXISTS "owner_full_access_editable_content" ON public.editable_content;

DROP POLICY IF EXISTS "Admins can manage editable content" ON public.editable_content;
CREATE POLICY "Admins can manage editable content"
ON public.editable_content
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('owner', 'admin')
  )
);

-- Log de correção usando colunas corretas
INSERT INTO security_events (
  event_type,
  severity,
  source,
  description,
  payload
) VALUES (
  'security_patch_applied',
  'info',
  'migration_v17',
  'Correção BLOCO 11: security_definer_view, device_trust_scores, editable_content',
  jsonb_build_object(
    'version', '17.0',
    'fixes', ARRAY['affiliates_safe_security_invoker', 'device_trust_scores_rls', 'editable_content_policies'],
    'applied_at', now()
  )
);
