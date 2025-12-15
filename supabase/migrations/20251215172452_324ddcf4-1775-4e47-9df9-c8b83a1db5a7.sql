
-- Check and fix profiles_public view if it exists
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate profiles_public with security_invoker
CREATE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  nome,
  avatar_url,
  level,
  xp_total,
  streak_days
FROM public.profiles;
