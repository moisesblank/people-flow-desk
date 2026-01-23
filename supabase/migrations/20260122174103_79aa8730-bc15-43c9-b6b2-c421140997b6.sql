-- P0 FIX: Conceder permissões de execução para funções de verificação de roles

-- Grant execute on check_is_owner
GRANT EXECUTE ON FUNCTION public.check_is_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_owner TO anon;

-- Grant execute on is_gestao_staff
GRANT EXECUTE ON FUNCTION public.is_gestao_staff TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gestao_staff TO anon;

-- Grant execute on outras funções críticas de verificação
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.is_aluno(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_aluno(uuid) TO anon;