-- ============================================
-- FIX: Security warnings da migration anterior
-- ============================================

-- 1. DROP da view SECURITY DEFINER e recriar como SECURITY INVOKER
DROP VIEW IF EXISTS public.alunos_presence;

CREATE VIEW public.alunos_presence
WITH (security_invoker = true)
AS
SELECT 
  a.id as aluno_id,
  a.email,
  p.id as auth_user_id,
  up.is_online,
  up.last_seen_at,
  up.device_type,
  CASE 
    WHEN up.is_online = true AND up.last_seen_at > now() - interval '15 minutes' THEN 'online'
    WHEN up.last_seen_at > now() - interval '1 hour' THEN 'away'
    ELSE 'offline'
  END as presence_status
FROM public.alunos a
LEFT JOIN public.profiles p ON lower(p.email) = lower(a.email)
LEFT JOIN public.user_presence up ON up.user_id = p.id;

-- Grant
GRANT SELECT ON public.alunos_presence TO authenticated;

-- 2. Adicionar política DELETE para user_presence (completar RLS)
CREATE POLICY "Users can delete own presence"
ON public.user_presence FOR DELETE
USING (auth.uid() = user_id);