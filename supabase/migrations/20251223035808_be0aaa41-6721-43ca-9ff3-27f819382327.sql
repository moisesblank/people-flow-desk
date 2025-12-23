-- Drop a view existente e recriar com estrutura correta
DROP VIEW IF EXISTS public.alunos_safe;

-- Criar view segura para dados sensíveis de alunos (mascara CPF/telefone)
CREATE VIEW public.alunos_safe AS
SELECT 
  id,
  nome,
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN email
    ELSE regexp_replace(email, '(.{3}).*(@.*)', '\1***\2')
  END as email,
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN cpf
    ELSE CASE WHEN cpf IS NOT NULL THEN '***.***.***-' || RIGHT(cpf, 2) ELSE NULL END
  END as cpf,
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN telefone
    ELSE CASE WHEN telefone IS NOT NULL THEN '(**) *****-' || RIGHT(telefone, 4) ELSE NULL END
  END as telefone,
  status,
  data_matricula,
  curso_id,
  created_at,
  updated_at
FROM public.alunos;

COMMENT ON VIEW public.alunos_safe IS 'View segura que mascara dados sensíveis (CPF, telefone, email) para usuários não-admin';