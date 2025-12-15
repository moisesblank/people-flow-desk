-- Primeiro dropar a view existente e recriar
DROP VIEW IF EXISTS public.employees_safe;

-- Criar view segura para profiles (leaderboard) - apenas dados públicos
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  nome,
  avatar_url
FROM public.profiles;

-- Recriar employees_safe view com segurança
CREATE VIEW public.employees_safe WITH (security_barrier = true) AS
SELECT 
  e.id,
  e.nome,
  e.funcao,
  e.setor,
  e.status,
  e.email,
  e.telefone,
  e.data_admissao,
  e.horario_trabalho,
  e.responsabilidades,
  e.created_at,
  e.updated_at,
  e.user_id,
  e.created_by,
  -- Mascarar salário para não-admins
  CASE 
    WHEN is_admin_or_owner(auth.uid()) THEN e.salario
    ELSE NULL
  END as salario
FROM public.employees e
WHERE is_admin_or_owner(auth.uid()) OR e.user_id = auth.uid();