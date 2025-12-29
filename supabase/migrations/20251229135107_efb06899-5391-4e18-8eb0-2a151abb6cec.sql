-- ============================================
-- DOGMA XI PATCH: BANIMENTO IMEDIATO (REVERSÍVEL)
-- Adiciona flags de ban + RPC de revogação
-- ============================================

-- 1. Adicionar colunas de banimento ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_by UUID;

-- 2. Índice para consultas rápidas de ban
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned) WHERE is_banned = true;

-- 3. Função para banir usuário e revogar todas as sessões
CREATE OR REPLACE FUNCTION public.ban_user_and_revoke_sessions(
  p_target_user_id UUID,
  p_reason TEXT DEFAULT 'Banido pelo administrador',
  p_banned_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_revoked INTEGER := 0;
  v_result JSON;
BEGIN
  -- 1. Marcar usuário como banido
  UPDATE public.profiles
  SET 
    is_banned = true,
    banned_at = now(),
    banned_reason = p_reason,
    banned_by = COALESCE(p_banned_by, auth.uid())
  WHERE id = p_target_user_id;

  -- 2. Revogar TODAS as sessões ativas do usuário
  UPDATE public.active_sessions
  SET 
    status = 'revoked',
    revoked_at = now(),
    revoked_reason = 'user_banned'
  WHERE user_id = p_target_user_id
    AND status = 'active';
  
  GET DIAGNOSTICS v_sessions_revoked = ROW_COUNT;

  -- 3. Registrar no audit log
  INSERT INTO public.audit_logs (action, user_id, metadata, table_name, record_id)
  VALUES (
    'user_banned',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', p_target_user_id,
      'reason', p_reason,
      'sessions_revoked', v_sessions_revoked
    ),
    'profiles',
    p_target_user_id::text
  );

  v_result := json_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'sessions_revoked', v_sessions_revoked,
    'banned_at', now()
  );

  RETURN v_result;
END;
$$;

-- 4. Função para desbanir usuário (reversível)
CREATE OR REPLACE FUNCTION public.unban_user(
  p_target_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_banned = false,
    banned_at = NULL,
    banned_reason = NULL,
    banned_by = NULL
  WHERE id = p_target_user_id;

  -- Registrar no audit log
  INSERT INTO public.audit_logs (action, user_id, metadata, table_name, record_id)
  VALUES (
    'user_unbanned',
    auth.uid(),
    jsonb_build_object('target_user_id', p_target_user_id),
    'profiles',
    p_target_user_id::text
  );

  RETURN json_build_object('success', true, 'user_id', p_target_user_id);
END;
$$;

-- 5. Função para verificar se usuário está banido (usada no login)
CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_banned, false)
  FROM public.profiles
  WHERE id = p_user_id;
$$;