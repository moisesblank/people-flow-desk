-- ============================================
-- PARTE 3: CONSTRAINTS + CRON PARA EXPIRAÇÃO
-- Constituição Synapse Ω v10.x
-- ============================================

-- 1. FUNÇÃO DE VALIDAÇÃO PARA expires_at
CREATE OR REPLACE FUNCTION public.validate_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se role = 'beta_expira', expires_at é OBRIGATÓRIO
  IF NEW.role = 'beta_expira' AND NEW.expires_at IS NULL THEN
    RAISE EXCEPTION 'expires_at é obrigatório para role beta_expira';
  END IF;
  
  -- Para roles de aluno (exceto beta_expira), expires_at deve ser NULL
  IF NEW.role IN ('beta', 'aluno_gratuito', 'aluno_presencial') AND NEW.expires_at IS NOT NULL THEN
    RAISE EXCEPTION 'expires_at não é permitido para role %', NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. TRIGGER PARA VALIDAÇÃO
DROP TRIGGER IF EXISTS validate_expires_at_trigger ON public.user_roles;
CREATE TRIGGER validate_expires_at_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expires_at();

-- 3. HABILITAR EXTENSÕES PARA CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. DROPAR FUNÇÃO ANTIGA E RECRIAR COM NOVO RETORNO
DROP FUNCTION IF EXISTS public.expire_beta_roles();

CREATE FUNCTION public.expire_beta_roles()
RETURNS TABLE (
  expired_user_id uuid,
  expired_email text,
  expired_nome text,
  expired_at timestamptz
) AS $$
DECLARE
  expired_count int := 0;
BEGIN
  -- Retornar os usuários que vão expirar ANTES de atualizar
  RETURN QUERY
  SELECT 
    ur.user_id as expired_user_id,
    p.email as expired_email,
    p.nome as expired_nome,
    ur.expires_at as expired_at
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'beta_expira' 
    AND ur.expires_at IS NOT NULL 
    AND ur.expires_at < NOW();
  
  -- Contar quantos vão expirar
  SELECT COUNT(*) INTO expired_count
  FROM public.user_roles
  WHERE role = 'beta_expira' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  -- Atualizar as roles
  UPDATE public.user_roles
  SET role = 'aluno_gratuito', expires_at = NULL
  WHERE role = 'beta_expira' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Log para auditoria
  IF expired_count > 0 THEN
    INSERT INTO public.audit_logs (action, table_name, metadata)
    VALUES (
      'EXPIRE_BETA_ROLE',
      'user_roles',
      jsonb_build_object(
        'function', 'expire_beta_roles',
        'executed_at', NOW(),
        'expired_count', expired_count
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;