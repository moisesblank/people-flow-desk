-- ============================================
-- FIX: Function Search Path Mutable
-- Adicionando search_path às funções que faltavam
-- ============================================

-- Corrigir normalize_email
CREATE OR REPLACE FUNCTION public.normalize_email(email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT LOWER(TRIM(COALESCE(email, '')))
$$;