-- ============================================
-- 🚀 ÍNDICES DE PERFORMANCE - VIDEO FORTRESS OMEGA
-- Otimização para 5000+ usuários simultâneos
-- ============================================

-- Índices para video_play_sessions (tabela mais acessada)
CREATE INDEX IF NOT EXISTS idx_vps_user_id ON public.video_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_session_token ON public.video_play_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_vps_user_active ON public.video_play_sessions(user_id) 
  WHERE revoked_at IS NULL AND ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vps_expires_at ON public.video_play_sessions(expires_at) 
  WHERE revoked_at IS NULL AND ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vps_provider_video ON public.video_play_sessions(provider_video_id);

-- Índices para video_violations
CREATE INDEX IF NOT EXISTS idx_vv_session_id ON public.video_violations(session_id);
CREATE INDEX IF NOT EXISTS idx_vv_user_id ON public.video_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_vv_created_at ON public.video_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vv_type ON public.video_violations(violation_type);

-- Índices para video_user_risk_scores (usando nome correto da coluna)
CREATE INDEX IF NOT EXISTS idx_vurs_user_id ON public.video_user_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_vurs_score ON public.video_user_risk_scores(total_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_vurs_banned ON public.video_user_risk_scores(is_banned) WHERE is_banned = true;

-- Índices para video_access_logs
CREATE INDEX IF NOT EXISTS idx_val_user_id ON public.video_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_val_session_id ON public.video_access_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_val_created_at ON public.video_access_logs(created_at DESC);

-- Índice composto para busca de sessão ativa
CREATE INDEX IF NOT EXISTS idx_vps_active_session 
  ON public.video_play_sessions(user_id, session_token, expires_at) 
  WHERE revoked_at IS NULL AND ended_at IS NULL;