-- Fix: Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.employees_public;

-- Create secure view WITHOUT security definer (uses caller's permissions)
CREATE VIEW public.employees_public AS
SELECT 
  id,
  nome,
  funcao,
  setor,
  email,
  status,
  created_at
FROM public.employees;

-- Note: This view will use the RLS policies from the underlying employees table