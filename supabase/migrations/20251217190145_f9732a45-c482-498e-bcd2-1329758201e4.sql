-- ============================================
-- CORREÇÃO SEGURANÇA v17.0 - 3 ERROS CRÍTICOS
-- profiles, employees, user_mfa_settings
-- ============================================

-- 1. PROFILES - Garantir acesso restrito
-- Verificar e corrigir políticas existentes
DO $$ 
BEGIN
  -- Remover políticas antigas se existirem
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_owner" ON public.profiles;
  DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
END $$;

-- Políticas SEGURAS para profiles
CREATE POLICY "profiles_user_select_own_v17" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    public.is_admin_or_owner(auth.uid())
  );

CREATE POLICY "profiles_user_update_own_v17" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR 
    public.is_owner(auth.uid())
  );

CREATE POLICY "profiles_user_insert_own_v17" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 2. EMPLOYEES - Acesso restrito a admin/owner
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admin view employees" ON public.employees;
  DROP POLICY IF EXISTS "employees_select_admin" ON public.employees;
  DROP POLICY IF EXISTS "Owner manages employees" ON public.employees;
  DROP POLICY IF EXISTS "employees_all_admin" ON public.employees;
END $$;

-- Políticas SEGURAS para employees
CREATE POLICY "employees_select_admin_v17" ON public.employees
  FOR SELECT USING (
    public.is_admin_or_owner(auth.uid()) OR
    user_id = auth.uid()
  );

CREATE POLICY "employees_insert_admin_v17" ON public.employees
  FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "employees_update_admin_v17" ON public.employees
  FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "employees_delete_owner_v17" ON public.employees
  FOR DELETE USING (public.is_owner(auth.uid()));

-- 3. USER_MFA_SETTINGS - Apenas o próprio usuário
-- Verificar se tabela existe primeiro
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_mfa_settings' AND table_schema = 'public') THEN
    -- Habilitar RLS se não estiver
    ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Users own mfa" ON public.user_mfa_settings;
    DROP POLICY IF EXISTS "user_mfa_select" ON public.user_mfa_settings;
    
    -- Criar políticas restritivas
    EXECUTE 'CREATE POLICY "mfa_user_select_own_v17" ON public.user_mfa_settings FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "mfa_user_insert_own_v17" ON public.user_mfa_settings FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "mfa_user_update_own_v17" ON public.user_mfa_settings FOR UPDATE USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "mfa_user_delete_own_v17" ON public.user_mfa_settings FOR DELETE USING (user_id = auth.uid())';
  END IF;
END $$;

-- 4. EMPLOYEE_COMPENSATION - Apenas owner
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Owner view salaries" ON public.employee_compensation;
  DROP POLICY IF EXISTS "compensation_owner_only" ON public.employee_compensation;
END $$;

CREATE POLICY "compensation_owner_only_v17" ON public.employee_compensation
  FOR ALL USING (public.is_owner(auth.uid()));

-- Log de segurança
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES ('SECURITY_FIX_V17', 'multiple', jsonb_build_object(
  'tables_fixed', ARRAY['profiles', 'employees', 'user_mfa_settings', 'employee_compensation'],
  'timestamp', NOW(),
  'version', '17.0'
));