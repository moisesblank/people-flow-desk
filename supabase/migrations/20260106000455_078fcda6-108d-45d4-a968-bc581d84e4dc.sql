-- Fix 42P10 on add_user_xp(): ensure user_gamification supports ON CONFLICT(user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_gamification_user_id_key'
      AND conrelid = 'public.user_gamification'::regclass
  ) THEN
    ALTER TABLE public.user_gamification
      ADD CONSTRAINT user_gamification_user_id_key UNIQUE (user_id);
  END IF;
END $$;
