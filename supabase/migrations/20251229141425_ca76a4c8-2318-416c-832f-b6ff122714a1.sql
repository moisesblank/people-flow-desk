-- ============================================
-- 🛡️ NUCLEAR LOCKDOWN SYSTEM v1.0
-- BLOCO 1: CONTENÇÃO IMEDIATA
-- BLOCO 2: CORTE TOTAL DE SESSÕES (AUTH_EPOCH)
-- ============================================

-- 1. CRIAR TABELA SYSTEM_GUARD (KILL SWITCH GLOBAL)
CREATE TABLE IF NOT EXISTS public.system_guard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_enabled BOOLEAN NOT NULL DEFAULT true,
  auth_epoch INTEGER NOT NULL DEFAULT 1,
  last_lockdown_at TIMESTAMPTZ,
  last_lockdown_by UUID,
  last_lockdown_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir registro único (singleton)
INSERT INTO public.system_guard (id, auth_enabled, auth_epoch)
VALUES ('00000000-0000-0000-0000-000000000001', true, 1)
ON CONFLICT (id) DO NOTHING;

-- 2. HABILITAR RLS
ALTER TABLE public.system_guard ENABLE ROW LEVEL SECURITY;

-- 3. RLS: TODOS PODEM LER (para verificar auth_enabled)
CREATE POLICY "system_guard_select_all"
ON public.system_guard
FOR SELECT
USING (true);

-- 4. RLS: SOMENTE OWNER PODE ALTERAR
CREATE POLICY "system_guard_update_owner_only"
ON public.system_guard
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 5. ADICIONAR CAMPO auth_epoch_at_login EM active_sessions
ALTER TABLE public.active_sessions
ADD COLUMN IF NOT EXISTS auth_epoch_at_login INTEGER DEFAULT 1;

-- 6. FUNÇÃO: Verificar se auth está habilitado
CREATE OR REPLACE FUNCTION public.check_auth_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT auth_enabled FROM public.system_guard LIMIT 1),
    true
  );
$$;

-- 7. FUNÇÃO: Obter epoch atual
CREATE OR REPLACE FUNCTION public.get_current_auth_epoch()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT auth_epoch FROM public.system_guard LIMIT 1),
    1
  );
$$;

-- 8. FUNÇÃO: Validar sessão por epoch
CREATE OR REPLACE FUNCTION public.validate_session_epoch(p_session_token TEXT)
RETURNS TABLE(is_valid BOOLEAN, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_current_epoch INTEGER;
  v_auth_enabled BOOLEAN;
BEGIN
  -- Verificar auth_enabled primeiro
  SELECT auth_enabled, auth_epoch INTO v_auth_enabled, v_current_epoch
  FROM public.system_guard LIMIT 1;
  
  IF NOT COALESCE(v_auth_enabled, true) THEN
    RETURN QUERY SELECT false, 'AUTH_DISABLED'::TEXT;
    RETURN;
  END IF;
  
  -- Buscar sessão
  SELECT * INTO v_session
  FROM public.active_sessions
  WHERE session_token = p_session_token
    AND status = 'active'
    AND expires_at > now();
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT false, 'SESSION_NOT_FOUND'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar epoch
  IF COALESCE(v_session.auth_epoch_at_login, 0) != COALESCE(v_current_epoch, 1) THEN
    -- Revogar sessão automaticamente
    UPDATE public.active_sessions
    SET status = 'revoked',
        revoked_at = now(),
        revoked_reason = 'AUTH_EPOCH_REVOKED'
    WHERE id = v_session.id;
    
    RETURN QUERY SELECT false, 'AUTH_EPOCH_REVOKED'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'VALID'::TEXT;
END;
$$;

-- 9. FUNÇÃO: NUCLEAR REVOKE ALL SESSIONS (incrementa epoch)
CREATE OR REPLACE FUNCTION public.nuclear_revoke_all_sessions(p_reason TEXT DEFAULT 'NUCLEAR_LOCKDOWN')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- Verificar se é owner
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'APENAS OWNER PODE EXECUTAR NUCLEAR REVOKE';
  END IF;
  
  -- Incrementar epoch (mata TODAS as sessões)
  UPDATE public.system_guard
  SET auth_epoch = auth_epoch + 1,
      last_lockdown_at = now(),
      last_lockdown_by = auth.uid(),
      last_lockdown_reason = p_reason,
      updated_at = now();
  
  -- Revogar todas as sessões ativas
  UPDATE public.active_sessions
  SET status = 'revoked',
      revoked_at = now(),
      revoked_reason = p_reason
  WHERE status = 'active';
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  
  RETURN v_affected;
END;
$$;

-- 10. FUNÇÃO: LOCKDOWN TOGGLE (desabilitar/habilitar auth)
CREATE OR REPLACE FUNCTION public.toggle_auth_lockdown(p_enabled BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é owner
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'APENAS OWNER PODE EXECUTAR LOCKDOWN';
  END IF;
  
  -- Atualizar estado
  UPDATE public.system_guard
  SET auth_enabled = p_enabled,
      last_lockdown_at = CASE WHEN NOT p_enabled THEN now() ELSE last_lockdown_at END,
      last_lockdown_by = CASE WHEN NOT p_enabled THEN auth.uid() ELSE last_lockdown_by END,
      last_lockdown_reason = CASE WHEN NOT p_enabled THEN p_reason ELSE last_lockdown_reason END,
      updated_at = now();
  
  -- Se desabilitando, incrementar epoch também
  IF NOT p_enabled THEN
    UPDATE public.system_guard
    SET auth_epoch = auth_epoch + 1;
  END IF;
  
  RETURN p_enabled;
END;
$$;

-- 11. TRIGGER: Atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_system_guard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_system_guard_updated_at ON public.system_guard;
CREATE TRIGGER trigger_system_guard_updated_at
  BEFORE UPDATE ON public.system_guard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_guard_timestamp();

-- 12. GRANT EXECUTE para funções
GRANT EXECUTE ON FUNCTION public.check_auth_enabled() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_auth_epoch() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session_epoch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nuclear_revoke_all_sessions(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_auth_lockdown(BOOLEAN, TEXT) TO authenticated;