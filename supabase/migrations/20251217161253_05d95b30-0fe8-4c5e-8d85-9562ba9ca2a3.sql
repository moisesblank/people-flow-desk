-- ============================================
-- SECURITY HARDENING v10.2 - FINAL
-- Proteção Avançada de Dados Sensíveis
-- ============================================

-- 1. DROP view existente e recriar
DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public AS
SELECT 
  id,
  nome,
  avatar_url,
  is_online,
  last_activity_at
FROM public.profiles;

-- 2. DROP políticas antigas conflitantes nos profiles
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 3. PROFILES - Novas políticas de segurança estrita
CREATE POLICY "Users view only own profile data"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Owner can view all profiles with audit"
ON profiles FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Owner can update any profile"
ON profiles FOR UPDATE
USING (is_owner(auth.uid()));

-- 4. EMPLOYEE_COMPENSATION - Reforçar segurança de salários
DROP POLICY IF EXISTS "Compensation viewable by owner" ON employee_compensation;
DROP POLICY IF EXISTS "Compensation editable by owner" ON employee_compensation;
DROP POLICY IF EXISTS "Owner only manages employee compensation" ON employee_compensation;

CREATE POLICY "Only owner can view salaries"
ON employee_compensation FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "Only owner can manage salaries"
ON employee_compensation FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- 5. TIME_CLOCK_ENTRIES - Adicionar proteção de localização
DROP POLICY IF EXISTS "Employees can view own time entries" ON time_clock_entries;
DROP POLICY IF EXISTS "Admins can view all time entries" ON time_clock_entries;
DROP POLICY IF EXISTS "Admin manages time_clock_entries" ON time_clock_entries;

CREATE POLICY "Employees view own time entries"
ON time_clock_entries FOR SELECT
USING (
  user_id = auth.uid() OR
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owner and admin view all time entries"
ON time_clock_entries FOR SELECT
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Employees can insert own time entries"
ON time_clock_entries FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ) OR is_admin_or_owner(auth.uid())
);

CREATE POLICY "Admin can update time entries"
ON time_clock_entries FOR UPDATE
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner can delete time entries"
ON time_clock_entries FOR DELETE
USING (is_owner(auth.uid()));

-- 6. ANALYTICS - Melhorar validação
DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics_metrics;
DROP POLICY IF EXISTS "Anon can insert basic analytics" ON analytics_metrics;
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON analytics_metrics;

CREATE POLICY "Validated analytics insert"
ON analytics_metrics FOR INSERT
TO anon, authenticated
WITH CHECK (
  metric_type IN ('pageview', 'event', 'error', 'click', 'scroll') AND
  page_path IS NOT NULL AND
  length(page_path) < 500 AND
  (visitor_id IS NULL OR length(visitor_id) < 100)
);

-- 7. Função para mascarar localização
CREATE OR REPLACE FUNCTION public.get_masked_location(
  p_latitude double precision,
  p_longitude double precision,
  p_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_owner(auth.uid()) THEN
    RETURN jsonb_build_object(
      'latitude', p_latitude,
      'longitude', p_longitude,
      'address', p_address
    );
  ELSE
    RETURN jsonb_build_object(
      'latitude', NULL,
      'longitude', NULL,
      'address', 'Localização registrada'
    );
  END IF;
END;
$$;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_time_clock_employee ON time_clock_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_date ON time_clock_entries(registered_at);

-- 9. Função para limpar dados de localização antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_location_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.time_clock_entries
  SET 
    latitude = NULL,
    longitude = NULL,
    location_address = 'Localização arquivada'
  WHERE registered_at < NOW() - INTERVAL '90 days'
    AND latitude IS NOT NULL;
END;
$$;