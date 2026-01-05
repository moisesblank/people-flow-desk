-- Tornar campos opcionais no simulados
ALTER TABLE public.simulados 
  ALTER COLUMN tolerance_minutes DROP NOT NULL,
  ALTER COLUMN passing_score DROP NOT NULL,
  ALTER COLUMN max_tab_switches DROP NOT NULL;