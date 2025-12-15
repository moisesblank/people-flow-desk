-- CORREÇÃO FINAL DE SEGURANÇA v3.0

-- 1. PROFILES - Reforçar política para evitar acesso público
DROP POLICY IF EXISTS "Only authenticated users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only owner views all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admin views all profiles" ON public.profiles;

-- Criar política única que consolida todos os acessos
CREATE POLICY "Profiles access control" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    id = auth.uid() 
    OR has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 2. AFFILIATES - Garantir que só admin/owner podem acessar
DROP POLICY IF EXISTS "Admin owner view affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates admin access" ON public.affiliates;

CREATE POLICY "Affiliates restricted to admin owner" 
ON public.affiliates 
FOR ALL
USING (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()));

-- 3. TIME_CLOCK_ENTRIES - Proteger dados de localização
DROP POLICY IF EXISTS "Employee view own time entries" ON public.time_clock_entries;
DROP POLICY IF EXISTS "Admin owner view all time entries" ON public.time_clock_entries;

-- Funcionário só vê suas próprias entradas
CREATE POLICY "Time entries employee self only" 
ON public.time_clock_entries 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    user_id = auth.uid() 
    OR is_admin_or_owner(auth.uid())
  )
);

-- Admin/owner gerencia todas
CREATE POLICY "Time entries admin manage all" 
ON public.time_clock_entries 
FOR ALL
USING (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_owner(auth.uid()));

-- Funcionário pode inserir/atualizar apenas suas próprias entradas
CREATE POLICY "Time entries employee insert own" 
ON public.time_clock_entries 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Time entries employee update own" 
ON public.time_clock_entries 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());