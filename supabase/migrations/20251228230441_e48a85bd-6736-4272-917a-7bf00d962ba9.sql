-- Corrigir VIEW para usar SECURITY INVOKER (não DEFINER)
DROP VIEW IF EXISTS public.user_access_status;

CREATE VIEW public.user_access_status 
WITH (security_invoker = true)
AS
SELECT 
    ur.user_id,
    ur.role,
    ur.expires_at,
    CASE 
        WHEN ur.role IN ('owner', 'admin', 'beta', 'aluno_presencial') THEN TRUE
        WHEN ur.role = 'beta_expira' AND (ur.expires_at IS NULL OR ur.expires_at > NOW()) THEN TRUE
        ELSE FALSE
    END as has_premium_access,
    CASE 
        WHEN ur.role = 'beta_expira' AND ur.expires_at IS NOT NULL THEN 
            GREATEST(0, EXTRACT(DAY FROM ur.expires_at - NOW())::INT)
        ELSE NULL
    END as days_remaining,
    p.nome,
    p.email,
    p.avatar_url
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id;