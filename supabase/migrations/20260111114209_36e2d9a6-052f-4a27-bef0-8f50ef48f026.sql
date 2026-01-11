-- ============================================
-- 🚀 PATCH 5K: RPC para contadores agregados
-- Substitui 7 queries paralelas por 1 única
-- ============================================

CREATE OR REPLACE FUNCTION public.get_alunos_contadores()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM alunos),
    'ativos', (SELECT COUNT(*) FROM alunos WHERE LOWER(status) = 'ativo'),
    'concluidos', (SELECT COUNT(*) FROM alunos WHERE LOWER(status) = 'concluído'),
    'pendentes', (SELECT COUNT(*) FROM alunos WHERE LOWER(status) = 'pendente'),
    'cancelados', (SELECT COUNT(*) FROM alunos WHERE LOWER(status) = 'cancelado'),
    'beta', (SELECT COUNT(*) FROM user_roles WHERE role = 'beta'),
    'gratuito', (SELECT COUNT(*) FROM user_roles WHERE role = 'aluno_gratuito')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_alunos_contadores() TO authenticated;