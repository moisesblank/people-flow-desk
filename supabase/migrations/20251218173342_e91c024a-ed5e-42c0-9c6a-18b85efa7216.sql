-- CORREÇÃO CRÍTICA: Usar auth.jwt() em vez de auth.users para evitar permission denied

-- 1. Corrigir função is_owner para usar auth.jwt()
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'moisesblank@gmail.com'
$$;

-- 2. Corrigir policy alunos_own_data_v4 para usar auth.jwt() em vez de subquery em auth.users
DROP POLICY IF EXISTS "alunos_own_data_v4" ON public.alunos;

CREATE POLICY "alunos_own_data_v4" ON public.alunos
  FOR SELECT USING (
    email = (auth.jwt() ->> 'email')::text
    OR is_admin_or_owner(auth.uid())
  );

-- 3. Garantir que user_mfa_settings tem policies corretas
DROP POLICY IF EXISTS "user_mfa_settings_select_own" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "user_mfa_settings_insert_own" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "user_mfa_settings_update_own" ON public.user_mfa_settings;
DROP POLICY IF EXISTS "user_mfa_settings_delete_own" ON public.user_mfa_settings;

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_mfa_settings_select_own" ON public.user_mfa_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_mfa_settings_insert_own" ON public.user_mfa_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_mfa_settings_update_own" ON public.user_mfa_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_mfa_settings_delete_own" ON public.user_mfa_settings
  FOR DELETE USING (user_id = auth.uid());

-- 4. Verificar e corrigir outras policies que possam usar auth.users
-- Função auxiliar para obter email do usuário atual de forma segura
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email')::text
$$;