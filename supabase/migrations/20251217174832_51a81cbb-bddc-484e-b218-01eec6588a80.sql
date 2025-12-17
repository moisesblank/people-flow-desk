-- ============================================
-- CORREÇÃO DE SEGURANÇA v2.1 - FIX
-- ============================================

-- Drop políticas existentes que podem conflitar
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recriar políticas de profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Owner can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Atualizar função de perfil seguro
CREATE OR REPLACE FUNCTION public.get_safe_profile(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  avatar_url text,
  is_online boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.avatar_url,
    p.is_online
  FROM public.profiles p
  WHERE p.id = p_user_id
    AND (p_user_id = auth.uid() OR public.is_owner(auth.uid()))
$$;