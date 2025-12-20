-- =====================================================
-- CORREÇÃO DE SEGURANÇA: RLS POLICIES PARA TODAS AS TABELAS EXPOSTAS
-- Owner: moisesblank@gmail.com
-- =====================================================

-- 1. PROFILES - Restringir acesso ao próprio perfil ou admin/owner
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id OR public.is_owner(auth.uid()) OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id OR public.is_owner(auth.uid()));

-- 2. ALUNOS - Apenas admin/owner podem ver
DROP POLICY IF EXISTS "Anyone can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins can manage alunos" ON public.alunos;

CREATE POLICY "Only admin/owner can view alunos" 
ON public.alunos FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Only admin/owner can insert alunos" 
ON public.alunos FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Only admin/owner can update alunos" 
ON public.alunos FOR UPDATE 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Only owner can delete alunos" 
ON public.alunos FOR DELETE 
TO authenticated
USING (public.is_owner(auth.uid()));

-- 3. EMPLOYEES - Funcionário vê próprio registro, admin/owner vê todos
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;
DROP POLICY IF EXISTS "Employees viewable by authenticated" ON public.employees;

CREATE POLICY "Employees can view own record or admin views all" 
ON public.employees FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "Only admin/owner can insert employees" 
ON public.employees FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admin/owner can update employees" 
ON public.employees FOR UPDATE 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Only owner can delete employees" 
ON public.employees FOR DELETE 
TO authenticated
USING (public.is_owner(auth.uid()));

-- 4. EMPLOYEE_COMPENSATION - Apenas owner pode ver salários
DROP POLICY IF EXISTS "Anyone can view compensation" ON public.employee_compensation;

CREATE POLICY "Only owner can view compensation" 
ON public.employee_compensation FOR SELECT 
TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "Only owner can manage compensation" 
ON public.employee_compensation FOR ALL 
TO authenticated
USING (public.is_owner(auth.uid()));

-- 5. TRANSACOES_HOTMART_COMPLETO - Apenas admin/owner
DROP POLICY IF EXISTS "Anyone can view transacoes" ON public.transacoes_hotmart_completo;

CREATE POLICY "Only admin/owner can view transacoes_hotmart" 
ON public.transacoes_hotmart_completo FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Only admin/owner can manage transacoes_hotmart" 
ON public.transacoes_hotmart_completo FOR ALL 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- 6. AFFILIATES - Afiliado vê próprio registro, admin/owner vê todos
DROP POLICY IF EXISTS "Anyone can view affiliates" ON public.affiliates;

CREATE POLICY "Affiliates can view own or admin views all" 
ON public.affiliates FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "Only admin/owner can insert affiliates" 
ON public.affiliates FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Affiliate can update own or admin updates all" 
ON public.affiliates FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "Only owner can delete affiliates" 
ON public.affiliates FOR DELETE 
TO authenticated
USING (public.is_owner(auth.uid()));

-- 7. WHATSAPP_LEADS - Apenas admin/owner/suporte
DROP POLICY IF EXISTS "Anyone can view whatsapp_leads" ON public.whatsapp_leads;

CREATE POLICY "Only staff can view whatsapp_leads" 
ON public.whatsapp_leads FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'suporte'));

CREATE POLICY "Only staff can manage whatsapp_leads" 
ON public.whatsapp_leads FOR ALL 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'suporte'));

-- 8. WHATSAPP_CONVERSATIONS - Apenas admin/owner/suporte
DROP POLICY IF EXISTS "Anyone can view whatsapp_conversations" ON public.whatsapp_conversations;

CREATE POLICY "Only staff can view whatsapp_conversations" 
ON public.whatsapp_conversations FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'suporte'));

CREATE POLICY "Only staff can manage whatsapp_conversations" 
ON public.whatsapp_conversations FOR ALL 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'suporte'));

-- 9. WHATSAPP_MESSAGES - Apenas admin/owner/suporte
DROP POLICY IF EXISTS "Anyone can view whatsapp_messages" ON public.whatsapp_messages;

CREATE POLICY "Only staff can view whatsapp_messages" 
ON public.whatsapp_messages FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'suporte'));

CREATE POLICY "Only staff can manage whatsapp_messages" 
ON public.whatsapp_messages FOR ALL 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'suporte'));

-- 10. PAGAMENTOS_CURSOS - Apenas admin/owner/contabilidade
DROP POLICY IF EXISTS "Anyone can view pagamentos_cursos" ON public.pagamentos_cursos;

CREATE POLICY "Only financial staff can view pagamentos_cursos" 
ON public.pagamentos_cursos FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'contabilidade'));

CREATE POLICY "Only admin/owner can manage pagamentos_cursos" 
ON public.pagamentos_cursos FOR ALL 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- 11. USUARIOS_WORDPRESS_SYNC - Apenas owner
DROP POLICY IF EXISTS "Anyone can view usuarios_wordpress" ON public.usuarios_wordpress_sync;

CREATE POLICY "Only owner can view usuarios_wordpress_sync" 
ON public.usuarios_wordpress_sync FOR SELECT 
TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "Only owner can manage usuarios_wordpress_sync" 
ON public.usuarios_wordpress_sync FOR ALL 
TO authenticated
USING (public.is_owner(auth.uid()));

-- 12. WOOCOMMERCE_ORDERS - Apenas admin/owner
DROP POLICY IF EXISTS "Anyone can view woocommerce_orders" ON public.woocommerce_orders;

CREATE POLICY "Only admin/owner can view woocommerce_orders" 
ON public.woocommerce_orders FOR SELECT 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Only admin/owner can manage woocommerce_orders" 
ON public.woocommerce_orders FOR ALL 
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

-- GARANTIR RLS HABILITADO EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_hotmart_completo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_wordpress_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_orders ENABLE ROW LEVEL SECURITY;

-- LOG DE AUDITORIA DA CORREÇÃO
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES ('SECURITY_FIX', 'multiple_tables', jsonb_build_object(
  'fixed_at', NOW(),
  'tables_secured', ARRAY[
    'profiles', 'alunos', 'employees', 'employee_compensation',
    'transacoes_hotmart_completo', 'affiliates', 'whatsapp_leads',
    'whatsapp_conversations', 'whatsapp_messages', 'pagamentos_cursos',
    'usuarios_wordpress_sync', 'woocommerce_orders'
  ],
  'fix_type', 'rls_policies_v2'
));