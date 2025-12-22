-- ============================================
-- SANCTUM OMEGA ULTRA — PARTE 2
-- Funções e Policies Adicionais
-- ============================================

-- ============================================
-- 11) FUNÇÃO: fn_register_sanctum_violation
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_register_sanctum_violation(
  p_user_id UUID, 
  p_user_email TEXT, 
  p_violation_type TEXT, 
  p_severity INTEGER, 
  p_asset_id UUID DEFAULT NULL, 
  p_domain TEXT DEFAULT NULL, 
  p_route TEXT DEFAULT NULL, 
  p_ip_hash TEXT DEFAULT NULL, 
  p_ua_hash TEXT DEFAULT NULL, 
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_locked BOOLEAN;
  v_user_role TEXT;
BEGIN
  -- OWNER BYPASS: moisesblank@gmail.com é IMUNE
  IF LOWER(p_user_email) = 'moisesblank@gmail.com' THEN
    RETURN jsonb_build_object('success', true, 'locked', false, 'immune', true);
  END IF;
  
  -- Buscar role do usuário
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
  
  -- Registrar violação
  INSERT INTO public.sanctum_asset_access (
    user_id, user_email, user_role, asset_id, 
    event_type, violation_type, severity, violation_detected, 
    domain, route, ip_hash, ua_hash, metadata
  ) VALUES (
    p_user_id, p_user_email, v_user_role, p_asset_id, 
    'violation', p_violation_type, p_severity, true, 
    p_domain, p_route, p_ip_hash, p_ua_hash, p_metadata
  );
  
  -- Verificar se usuário foi bloqueado (trigger já aplicou)
  v_is_locked := public.fn_check_sanctum_lock(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'locked', v_is_locked, 
    'violationType', p_violation_type, 
    'severity', p_severity
  );
END;
$$;

-- ============================================
-- 12) FUNÇÃO: fn_get_sanctum_stats
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_sanctum_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalAssets', (SELECT COUNT(*) FROM public.ena_assets),
    'readyAssets', (SELECT COUNT(*) FROM public.ena_assets WHERE status = 'ready'),
    'pendingAssets', (SELECT COUNT(*) FROM public.ena_assets WHERE status = 'pending'),
    'totalPages', (SELECT COALESCE(SUM(total_pages), 0) FROM public.ena_assets),
    'totalViolations', (SELECT COUNT(*) FROM public.sanctum_asset_access WHERE violation_detected = true),
    'violationsToday', (SELECT COUNT(*) FROM public.sanctum_asset_access WHERE violation_detected = true AND created_at > now() - INTERVAL '24 hours'),
    'lockedUsers', (SELECT COUNT(*) FROM public.sanctum_risk_state WHERE locked_until > now()),
    'highRiskUsers', (SELECT COUNT(*) FROM public.sanctum_risk_state WHERE risk_score >= 100),
    'pendingJobs', (SELECT COUNT(*) FROM public.sanctum_jobs_queue WHERE status = 'pending'),
    'topViolationTypes', (
      SELECT jsonb_agg(row_to_json(v)) 
      FROM (
        SELECT violation_type, COUNT(*) as count 
        FROM public.sanctum_asset_access 
        WHERE violation_detected = true 
        AND created_at > now() - INTERVAL '7 days' 
        GROUP BY violation_type 
        ORDER BY count DESC 
        LIMIT 10
      ) v
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ============================================
-- 13) RLS POLICIES ATUALIZADAS
-- ============================================

-- Remover policies antigas e recriar com auth.email()
DROP POLICY IF EXISTS "ena_assets_owner_all" ON public.ena_assets;
DROP POLICY IF EXISTS "ena_assets_select_allowed" ON public.ena_assets;
DROP POLICY IF EXISTS "ena_assets_beta_read" ON public.ena_assets;

CREATE POLICY "ena_assets_owner_all" ON public.ena_assets 
  FOR ALL TO authenticated 
  USING (
    auth.email() = 'moisesblank@gmail.com' 
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
  );

CREATE POLICY "ena_assets_beta_read" ON public.ena_assets 
  FOR SELECT TO authenticated 
  USING (
    status = 'ready' 
    AND (
      NOT is_premium 
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('beta', 'owner', 'admin'))
    )
  );

-- ena_asset_pages
DROP POLICY IF EXISTS "ena_asset_pages_owner_all" ON public.ena_asset_pages;
DROP POLICY IF EXISTS "ena_asset_pages_select" ON public.ena_asset_pages;
DROP POLICY IF EXISTS "ena_asset_pages_beta_read" ON public.ena_asset_pages;

CREATE POLICY "ena_asset_pages_owner_all" ON public.ena_asset_pages 
  FOR ALL TO authenticated 
  USING (
    auth.email() = 'moisesblank@gmail.com' 
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
  );

CREATE POLICY "ena_asset_pages_beta_read" ON public.ena_asset_pages 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.ena_assets a 
      WHERE a.id = asset_id 
      AND a.status = 'ready' 
      AND (
        NOT a.is_premium 
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('beta', 'owner', 'admin'))
      )
    )
  );

-- sanctum_risk_state
DROP POLICY IF EXISTS "sanctum_risk_owner_all" ON public.sanctum_risk_state;
DROP POLICY IF EXISTS "sanctum_risk_self" ON public.sanctum_risk_state;
DROP POLICY IF EXISTS "sanctum_risk_own" ON public.sanctum_risk_state;

CREATE POLICY "sanctum_risk_own" ON public.sanctum_risk_state 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR auth.email() = 'moisesblank@gmail.com' 
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
  );

-- sanctum_asset_access
DROP POLICY IF EXISTS "sanctum_access_owner_all" ON public.sanctum_asset_access;
DROP POLICY IF EXISTS "sanctum_access_self" ON public.sanctum_asset_access;
DROP POLICY IF EXISTS "sanctum_access_admin" ON public.sanctum_asset_access;

CREATE POLICY "sanctum_access_admin" ON public.sanctum_asset_access 
  FOR ALL TO authenticated 
  USING (
    auth.email() = 'moisesblank@gmail.com' 
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
  );

-- sanctum_jobs_queue
DROP POLICY IF EXISTS "sanctum_jobs_owner_only" ON public.sanctum_jobs_queue;
DROP POLICY IF EXISTS "sanctum_jobs_admin" ON public.sanctum_jobs_queue;

CREATE POLICY "sanctum_jobs_admin" ON public.sanctum_jobs_queue 
  FOR ALL TO authenticated 
  USING (
    auth.email() = 'moisesblank@gmail.com' 
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
  );

-- ============================================
-- 14) GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION public.fn_register_sanctum_violation TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_sanctum_stats TO authenticated;