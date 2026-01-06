-- Fix 42P10 on finish_simulado_attempt: weekly_xp trigger uses ON CONFLICT (user_id, week_start)
-- Ensure weekly_xp has a matching unique constraint.

ALTER TABLE public.weekly_xp
  DROP CONSTRAINT IF EXISTS weekly_xp_pkey;

ALTER TABLE public.weekly_xp
  ADD CONSTRAINT weekly_xp_pkey PRIMARY KEY (user_id, week_start);

-- Helpful index for weekly ranking queries
CREATE INDEX IF NOT EXISTS idx_weekly_xp_ranking
  ON public.weekly_xp (week_start, xp_this_week DESC);
