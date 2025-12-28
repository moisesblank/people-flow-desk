
-- ============================================
-- P0 FIX: gen_random_bytes NOT FOUND
-- Causa: pgcrypto está em schema 'extensions', funções usam search_path = public
-- Solução: Adicionar wrapper function no schema public
-- ============================================

-- Criar wrapper function no public schema para resolver gen_random_bytes
CREATE OR REPLACE FUNCTION public.gen_random_bytes(integer)
RETURNS bytea
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT extensions.gen_random_bytes($1);
$$;

-- Garantir que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION public.gen_random_bytes(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gen_random_bytes(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.gen_random_bytes(integer) TO service_role;

COMMENT ON FUNCTION public.gen_random_bytes(integer) IS 'P0 FIX: Wrapper para extensions.gen_random_bytes - corrige erro function does not exist';
