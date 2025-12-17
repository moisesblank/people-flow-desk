-- ============================================
-- CORREÇÃO DE SEGURANÇA v10.1 
-- Proteção de dados sensíveis com RLS
-- ============================================

-- 1. WOOCOMMERCE ORDERS - Restringir acesso a dados de clientes
DROP POLICY IF EXISTS "WooCommerce orders viewable by admins" ON woocommerce_orders;
DROP POLICY IF EXISTS "Authenticated can view orders" ON woocommerce_orders;

CREATE POLICY "Only admins can view woocommerce orders" 
ON woocommerce_orders FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Service can insert woocommerce orders" 
ON woocommerce_orders FOR INSERT 
WITH CHECK (true);

-- 2. ALUNOS - Melhorar proteção de dados de estudantes
DROP POLICY IF EXISTS "Alunos viewable by all authenticated" ON alunos;

-- Alunos podem ver seus próprios dados (via email)
CREATE POLICY "Students can view own data" 
ON alunos FOR SELECT 
USING (
  is_admin_or_owner(auth.uid()) OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 3. PROFILES - Restringir acesso a dados sensíveis
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;

-- Usuários podem ver seu próprio perfil completo
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (id = auth.uid());

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 4. SALES - Proteger dados de compradores
DROP POLICY IF EXISTS "Sales viewable by authenticated" ON sales;

CREATE POLICY "Only admins can view sales" 
ON sales FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 5. INTEGRATION EVENTS - Dados de webhooks sensíveis
DROP POLICY IF EXISTS "Integration events viewable by all" ON integration_events;

CREATE POLICY "Only admins can view integration events" 
ON integration_events FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- 6. WHATSAPP LEADS - Proteger dados de leads
DROP POLICY IF EXISTS "WhatsApp leads viewable by authenticated" ON whatsapp_leads;

CREATE POLICY "Only sales and admins can view leads" 
ON whatsapp_leads FOR SELECT 
USING (is_admin_or_owner(auth.uid()) OR has_role(auth.uid(), 'marketing'::app_role));

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_alunos_email ON alunos(email);