-- =============================================
-- CORREÇÃO SEGURANÇA v18.0 - 8 ERROS CRÍTICOS
-- Roles válidos: owner, admin, employee, coordenacao, suporte, monitoria, afiliado, marketing, contabilidade
-- =============================================

-- 1. EMPLOYEES - Acesso restrito a admin/owner
DROP POLICY IF EXISTS "employees_admin_owner_access" ON public.employees;

CREATE POLICY "employees_admin_owner_v18" ON public.employees
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
  OR user_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- 2. ALUNOS - Acesso restrito a admin/owner/coordenacao
DROP POLICY IF EXISTS "alunos_staff_access" ON public.alunos;

CREATE POLICY "alunos_staff_v18" ON public.alunos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'coordenacao')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- 3. AFFILIATES - Acesso restrito a admin/owner ou próprio afiliado
DROP POLICY IF EXISTS "affiliates_own_or_admin" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_admin_manage" ON public.affiliates;

CREATE POLICY "affiliates_access_v18" ON public.affiliates
FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- 4. ENTRADAS - Acesso restrito a admin/owner/contabilidade
DROP POLICY IF EXISTS "entradas_admin_owner_access" ON public.entradas;

CREATE POLICY "entradas_financial_v18" ON public.entradas
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'contabilidade')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'contabilidade')
  )
);

-- 5. GASTOS - Acesso restrito a admin/owner/contabilidade
DROP POLICY IF EXISTS "gastos_admin_owner_access" ON public.gastos;

CREATE POLICY "gastos_financial_v18" ON public.gastos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'contabilidade')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'contabilidade')
  )
);

-- 6. WHATSAPP TABLES - Acesso restrito a admin/owner/suporte
DROP POLICY IF EXISTS "whatsapp_leads_admin_owner_access" ON public.whatsapp_leads;

CREATE POLICY "whatsapp_leads_v18" ON public.whatsapp_leads
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'suporte')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'suporte')
  )
);

DROP POLICY IF EXISTS "whatsapp_conversations_admin_owner_access" ON public.whatsapp_conversations;

CREATE POLICY "whatsapp_conversations_v18" ON public.whatsapp_conversations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'suporte')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'suporte')
  )
);

DROP POLICY IF EXISTS "whatsapp_messages_admin_owner_access" ON public.whatsapp_messages;

CREATE POLICY "whatsapp_messages_v18" ON public.whatsapp_messages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'suporte')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner', 'suporte')
  )
);

-- 7. WOOCOMMERCE_ORDERS - Acesso restrito a admin/owner
DROP POLICY IF EXISTS "woocommerce_orders_admin_owner_access" ON public.woocommerce_orders;

CREATE POLICY "woocommerce_orders_v18" ON public.woocommerce_orders
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- 8. USER_MFA_SETTINGS - Apenas o próprio usuário
DROP POLICY IF EXISTS "user_mfa_own_only_access" ON public.user_mfa_settings;

CREATE POLICY "user_mfa_own_v18" ON public.user_mfa_settings
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;