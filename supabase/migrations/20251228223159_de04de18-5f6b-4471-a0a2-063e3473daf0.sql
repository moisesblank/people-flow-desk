-- ============================================
-- PASSO 9: Função de Expiração de Roles
-- CONSTITUIÇÃO SYNAPSE Ω v10.x
-- ============================================
-- Função que expira beta_expira → aluno_gratuito
-- Pode ser chamada via pg_cron ou edge function scheduled
-- ============================================

CREATE OR REPLACE FUNCTION public.expire_beta_roles()
RETURNS void AS $$
BEGIN
  UPDATE public.user_roles
  SET role = 'aluno_gratuito', expires_at = NULL
  WHERE role = 'beta_expira' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Log para auditoria (opcional, mas recomendado)
  INSERT INTO public.audit_logs (action, table_name, metadata)
  SELECT 
    'EXPIRE_BETA_ROLE',
    'user_roles',
    jsonb_build_object(
      'function', 'expire_beta_roles',
      'executed_at', NOW(),
      'expired_count', (
        SELECT COUNT(*) FROM public.user_roles 
        WHERE role = 'aluno_gratuito' 
          AND expires_at IS NULL
      )
    )
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'beta_expira' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentário explicativo
COMMENT ON FUNCTION public.expire_beta_roles() IS 
  'Expira roles beta_expira para aluno_gratuito quando expires_at < NOW(). 
   Chamada via pg_cron diariamente ou edge function scheduled.
   CONSTITUIÇÃO v10.x - PASSO 9';