-- Fix SECURITY DEFINER view - recriar como view normal
DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  avatar_url,
  is_online,
  last_activity_at
FROM public.profiles;