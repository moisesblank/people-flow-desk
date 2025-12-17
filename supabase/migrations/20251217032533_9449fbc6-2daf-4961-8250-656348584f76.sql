-- Corrigir Views com SECURITY DEFINER (removendo o atributo)
-- Usando security_invoker = true para aplicar RLS do usuário

-- Recriar view employees_public
DROP VIEW IF EXISTS public.employees_public;
CREATE VIEW public.employees_public 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  nome,
  email,
  funcao,
  setor,
  status,
  horario_trabalho,
  data_admissao
FROM public.employees
WHERE status = 'ativo';

-- Recriar view employees_safe
DROP VIEW IF EXISTS public.employees_safe;
CREATE VIEW public.employees_safe 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  nome,
  funcao,
  setor,
  status
FROM public.employees;

-- Recriar view profiles_public
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  nome,
  email,
  avatar_url,
  is_online,
  last_activity_at
FROM public.profiles;

-- Recriar view security_dashboard
DROP VIEW IF EXISTS public.security_dashboard;
CREATE VIEW public.security_dashboard 
WITH (security_invoker = true)
AS 
SELECT 
  'total_users' as metric,
  COUNT(*)::text as value
FROM public.profiles
UNION ALL
SELECT 
  'active_sessions',
  COUNT(*)::text
FROM public.user_sessions
WHERE is_active = true
UNION ALL
SELECT 
  'recent_logins_24h',
  COUNT(*)::text
FROM public.user_sessions
WHERE login_at > NOW() - INTERVAL '24 hours';

-- Recriar view whatsapp_leads_dashboard (corrigido - usando created_at)
DROP VIEW IF EXISTS public.whatsapp_leads_dashboard;
CREATE VIEW public.whatsapp_leads_dashboard 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  name,
  phone,
  source,
  status,
  contact_count,
  created_at,
  last_contact
FROM public.whatsapp_leads
ORDER BY last_contact DESC;