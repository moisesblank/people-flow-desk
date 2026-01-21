
-- ============================================
-- TRIGGER: Auto-sincronizar mfa_verified na sessão
-- quando uma verificação MFA é inserida
-- ============================================

-- Função que atualiza mfa_verified na sessão ativa
CREATE OR REPLACE FUNCTION public.sync_session_mfa_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma nova verificação MFA é inserida,
  -- atualizar automaticamente a sessão ativa correspondente
  UPDATE public.active_sessions
  SET mfa_verified = true
  WHERE user_id = NEW.user_id
    AND device_hash = NEW.device_hash
    AND status = 'active'
    AND expires_at > NOW()
    AND mfa_verified = false;
  
  -- Log para auditoria
  IF FOUND THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, metadata)
    VALUES (
      NEW.user_id,
      'AUTO_SYNC_MFA_VERIFIED',
      'active_sessions',
      jsonb_build_object(
        'device_hash', LEFT(NEW.device_hash, 16) || '...',
        'triggered_by', 'user_mfa_verifications_insert'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger na tabela user_mfa_verifications
DROP TRIGGER IF EXISTS trg_sync_session_mfa_on_verification ON public.user_mfa_verifications;
CREATE TRIGGER trg_sync_session_mfa_on_verification
  AFTER INSERT ON public.user_mfa_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_session_mfa_on_verification();

-- Comentário
COMMENT ON FUNCTION public.sync_session_mfa_on_verification() IS 
'Auto-sincroniza mfa_verified=true na sessão ativa quando uma verificação MFA é registrada. Previne loops de verificação.';
