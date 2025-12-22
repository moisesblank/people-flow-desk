-- ============================================
-- 🔥🛡️ VIDEO FORTRESS OMEGA v5.0 - PARTE FINAL 🛡️🔥
-- Funções avançadas + RLS + Grants + Realtime
-- ============================================

-- 7.6 Decay automático de risk score
CREATE OR REPLACE FUNCTION decay_video_risk_scores()
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  WITH decayed AS (
    UPDATE public.video_user_risk_scores
    SET current_score = GREATEST(0, current_score - decay_rate_per_day),
        last_decay_at = now()
    WHERE last_decay_at < now() - interval '1 day'
      AND current_score > 0
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_affected FROM decayed;
  
  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7.7 Cleanup de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_video_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.video_play_sessions
    SET ended_at = now(),
        revoke_reason = 'EXPIRED'
    WHERE expires_at < now()
      AND revoked_at IS NULL
      AND ended_at IS NULL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_affected FROM expired;
  
  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7.8 Obter métricas de vídeo
CREATE OR REPLACE FUNCTION get_video_metrics(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  total_sessions BIGINT,
  active_sessions BIGINT,
  total_violations BIGINT,
  unique_users BIGINT,
  avg_watch_seconds NUMERIC,
  revoked_sessions BIGINT,
  immune_sessions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE revoked_at IS NULL AND ended_at IS NULL AND expires_at > now())::BIGINT,
    (SELECT COUNT(*) FROM public.video_violations WHERE created_at > now() - (p_days || ' days')::interval)::BIGINT,
    COUNT(DISTINCT user_id)::BIGINT,
    ROUND(AVG(total_watch_seconds)::NUMERIC, 2),
    COUNT(*) FILTER (WHERE revoked_at IS NOT NULL)::BIGINT,
    COUNT(*) FILTER (WHERE sanctum_immune = TRUE)::BIGINT
  FROM public.video_play_sessions
  WHERE created_at > now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper: is_video_admin
CREATE OR REPLACE FUNCTION is_video_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'funcionario')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 8. RLS POLICIES (novas, mais específicas)
-- ============================================

-- Limpar policies anteriores
DROP POLICY IF EXISTS "Users can view own sessions" ON public.video_play_sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.video_play_sessions;
DROP POLICY IF EXISTS "Users can view own logs" ON public.video_access_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON public.video_access_logs;
DROP POLICY IF EXISTS "Users can view own violations" ON public.video_violations;
DROP POLICY IF EXISTS "Service role can insert violations" ON public.video_violations;
DROP POLICY IF EXISTS "Users can view own risk score" ON public.video_user_risk_scores;
DROP POLICY IF EXISTS "Service role can manage risk scores" ON public.video_user_risk_scores;
DROP POLICY IF EXISTS "Anyone can read domains" ON public.video_domain_whitelist;
DROP POLICY IF EXISTS "Only owner can manage domains" ON public.video_domain_whitelist;

-- video_play_sessions
DROP POLICY IF EXISTS "vps_select" ON public.video_play_sessions;
CREATE POLICY "vps_select" ON public.video_play_sessions
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

DROP POLICY IF EXISTS "vps_insert" ON public.video_play_sessions;
CREATE POLICY "vps_insert" ON public.video_play_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- video_access_logs
DROP POLICY IF EXISTS "val_select" ON public.video_access_logs;
CREATE POLICY "val_select" ON public.video_access_logs
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

DROP POLICY IF EXISTS "val_insert" ON public.video_access_logs;
CREATE POLICY "val_insert" ON public.video_access_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- video_violations
DROP POLICY IF EXISTS "vv_select" ON public.video_violations;
CREATE POLICY "vv_select" ON public.video_violations
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

DROP POLICY IF EXISTS "vv_insert" ON public.video_violations;
CREATE POLICY "vv_insert" ON public.video_violations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- video_user_risk_scores
DROP POLICY IF EXISTS "vurs_select" ON public.video_user_risk_scores;
CREATE POLICY "vurs_select" ON public.video_user_risk_scores
  FOR SELECT USING (user_id = auth.uid() OR is_video_admin());

-- video_domain_whitelist (somente admins)
DROP POLICY IF EXISTS "vdw_select" ON public.video_domain_whitelist;
CREATE POLICY "vdw_select" ON public.video_domain_whitelist
  FOR SELECT USING (is_video_admin());

-- ============================================
-- 9. GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION decay_video_risk_scores TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_video_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_video_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION is_video_admin TO authenticated;

-- ============================================
-- 10. REALTIME
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'video_play_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_play_sessions;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ============================================
-- ✅ FIM DA MIGRAÇÃO OMEGA v5.0
-- ============================================