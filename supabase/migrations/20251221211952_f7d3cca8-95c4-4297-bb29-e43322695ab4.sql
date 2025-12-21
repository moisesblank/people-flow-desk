-- ============================================
-- PARTE 10.7-10.9: GENOMA DIVINO - Gamificação
-- Criando tabela monthly_xp e completando
-- ============================================

-- 10.7.3 Criar tabela monthly_xp (para ranking mensal)
CREATE TABLE IF NOT EXISTS public.monthly_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  streak_max INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Índices da monthly_xp
CREATE INDEX IF NOT EXISTS idx_monthly_xp_ranking ON public.monthly_xp(year, month, xp_earned DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_xp_user ON public.monthly_xp(user_id, year DESC, month DESC);

-- RLS da monthly_xp
ALTER TABLE public.monthly_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_xp_own" ON public.monthly_xp;
CREATE POLICY "monthly_xp_own" ON public.monthly_xp FOR ALL 
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "monthly_xp_ranking_read" ON public.monthly_xp;
CREATE POLICY "monthly_xp_ranking_read" ON public.monthly_xp FOR SELECT 
USING (can_access_sanctuary(auth.uid()));

-- Weekly XP - permitir leitura para ranking
DROP POLICY IF EXISTS "weekly_xp_ranking_read" ON public.weekly_xp;
CREATE POLICY "weekly_xp_ranking_read" ON public.weekly_xp FOR SELECT 
USING (can_access_sanctuary(auth.uid()));

-- ============================================
-- TRIGGER PARA GAMIFICAÇÃO AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_update_weekly_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_week_start DATE;
BEGIN
  -- Calcular início da semana (segunda-feira)
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  -- Upsert na weekly_xp
  INSERT INTO public.weekly_xp (user_id, week_start, xp_this_week, last_updated)
  VALUES (NEW.user_id, v_week_start, NEW.amount, NOW())
  ON CONFLICT (user_id, week_start) 
  DO UPDATE SET 
    xp_this_week = weekly_xp.xp_this_week + NEW.amount,
    last_updated = NOW();
  
  -- Upsert na monthly_xp
  INSERT INTO public.monthly_xp (user_id, year, month, xp_earned)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, NEW.amount)
  ON CONFLICT (user_id, year, month) 
  DO UPDATE SET 
    xp_earned = monthly_xp.xp_earned + NEW.amount,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_xp_history_weekly ON public.xp_history;
CREATE TRIGGER tr_xp_history_weekly
  AFTER INSERT ON public.xp_history
  FOR EACH ROW EXECUTE FUNCTION fn_update_weekly_xp();

-- Índices restantes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON public.xp_history(user_id, created_at DESC);

-- Comentários
COMMENT ON TABLE public.monthly_xp IS 'Ranking mensal de XP para leaderboard';
COMMENT ON FUNCTION public.fn_update_weekly_xp IS 'Atualiza XP semanal e mensal automaticamente';