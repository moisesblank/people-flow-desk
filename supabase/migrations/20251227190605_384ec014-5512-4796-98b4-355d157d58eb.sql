
-- =====================================================
-- CONSTITUIÇÃO SYNAPSE Ω v10.0 — PARTE II
-- Funções SQL HARDENED + Variantes _uid()
-- =====================================================

-- 1) Função is_aluno (NOVA)
CREATE OR REPLACE FUNCTION public.is_aluno(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('beta', 'aluno_gratuito')
  );
$$;

COMMENT ON FUNCTION public.is_aluno(uuid) IS 'CONSTITUIÇÃO v10.0: Verifica se usuário é aluno (beta ou gratuito)';

-- 2) Variantes _uid() — Evitam passar user_id errado

CREATE OR REPLACE FUNCTION public.is_gestao_staff_uid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_gestao_staff(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_aluno_uid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_aluno(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_owner_uid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner(auth.uid());
$$;

-- 3) Comentários
COMMENT ON FUNCTION public.is_gestao_staff_uid() IS 'CONSTITUIÇÃO v10.0: is_gestao_staff para auth.uid() atual';
COMMENT ON FUNCTION public.is_aluno_uid() IS 'CONSTITUIÇÃO v10.0: is_aluno para auth.uid() atual';
COMMENT ON FUNCTION public.is_owner_uid() IS 'CONSTITUIÇÃO v10.0: is_owner para auth.uid() atual';

-- 4) Permissões (fail-closed, grants explícitos)
REVOKE ALL ON FUNCTION public.is_aluno(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_gestao_staff_uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_aluno_uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_owner_uid() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_aluno(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gestao_staff_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_aluno_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_uid() TO authenticated;
