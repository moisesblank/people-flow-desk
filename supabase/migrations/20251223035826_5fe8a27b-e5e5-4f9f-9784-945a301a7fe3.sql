-- Corrigir view para usar SECURITY INVOKER (respeita RLS do usuário, não do criador)
DROP VIEW IF EXISTS public.alunos_safe;

CREATE VIEW public.alunos_safe 
WITH (security_invoker = true) AS
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

COMMENT ON VIEW public.alunos_safe IS 'View segura com SECURITY INVOKER que mascara dados sensíveis para usuários não-admin';