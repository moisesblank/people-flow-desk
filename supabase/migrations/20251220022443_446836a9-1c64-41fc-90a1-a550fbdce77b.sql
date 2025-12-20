-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO FINAL: View com security_invoker
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. REMOVER VIEW anterior
DROP VIEW IF EXISTS public.alunos_safe;

-- 2. Recriar view com security_invoker = true
CREATE VIEW public.alunos_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  email,
  status,
  curso_id,
  data_matricula,
  cidade,
  estado,
  fonte,
  created_at
FROM public.alunos;

-- 3. Dar permissão de leitura para usuários autenticados
GRANT SELECT ON public.alunos_safe TO authenticated;