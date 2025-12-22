-- ============================================
-- 🔥🛡️ VIDEO FORTRESS OMEGA v5.0 - FIX 2 🛡️🔥
-- Usar is_owner(auth.uid()) explícito
-- ============================================

-- Drop existing policies first
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
CREATE POLICY "Users can view own sessions" ON public.video_play_sessions
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

CREATE POLICY "Service role can manage sessions" ON public.video_play_sessions
  FOR ALL USING (public.is_owner(auth.uid()));

-- video_access_logs
CREATE POLICY "Users can view own logs" ON public.video_access_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

CREATE POLICY "Service role can insert logs" ON public.video_access_logs
  FOR INSERT WITH CHECK (true);

-- video_violations
CREATE POLICY "Users can view own violations" ON public.video_violations
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

CREATE POLICY "Service role can insert violations" ON public.video_violations
  FOR INSERT WITH CHECK (true);

-- video_user_risk_scores
CREATE POLICY "Users can view own risk score" ON public.video_user_risk_scores
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));

CREATE POLICY "Service role can manage risk scores" ON public.video_user_risk_scores
  FOR ALL USING (public.is_owner(auth.uid()));

-- video_domain_whitelist (public read)
CREATE POLICY "Anyone can read domains" ON public.video_domain_whitelist
  FOR SELECT USING (true);

CREATE POLICY "Only owner can manage domains" ON public.video_domain_whitelist
  FOR ALL USING (public.is_owner(auth.uid()));