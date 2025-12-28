-- ============================================
-- PASSO 1B: Atualizar função is_aluno() com novas roles
-- CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
-- ============================================

CREATE OR REPLACE FUNCTION public.is_aluno(_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;