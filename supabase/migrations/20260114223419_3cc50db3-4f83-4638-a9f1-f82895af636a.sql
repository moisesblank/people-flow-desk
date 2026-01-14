-- ============================================
-- 🛡️ P0 SECURITY FIX: Função check_is_owner server-side
-- Remove necessidade de email hardcoded no frontend
-- ============================================

-- Função principal: verifica se o usuário autenticado é owner
CREATE OR REPLACE FUNCTION public.check_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
$$;

-- Função alternativa: verifica por user_id específico (para admin checks)
CREATE OR REPLACE FUNCTION public.check_is_owner_by_id(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = 'owner'
  )
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.check_is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_owner_by_id(uuid) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION public.check_is_owner() IS 'P0 Security: Verifica se o usuário atual é owner via role no banco, sem expor email no frontend';
COMMENT ON FUNCTION public.check_is_owner_by_id(uuid) IS 'P0 Security: Verifica se um user_id específico é owner via role no banco';