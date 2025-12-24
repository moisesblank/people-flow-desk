-- ============================================
-- 🛡️ SANCTUM 3.0: SECURITY RISK STATE + AUTO-LOCK
-- Tabela para rastreamento de risco e bloqueio automático
-- ============================================

-- 1) Criar tabela security_risk_state
CREATE TABLE IF NOT EXISTS public.security_risk_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  lock_reason TEXT,
  total_violations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_risk_state_locked 
  ON public.security_risk_state(locked_until) 
  WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_risk_state_score 
  ON public.security_risk_state(risk_score) 
  WHERE risk_score >= 100;

-- 3) Habilitar RLS
ALTER TABLE public.security_risk_state ENABLE ROW LEVEL SECURITY;

-- 4) Políticas RLS (apenas owner/funcionário pode ver)
CREATE POLICY "Owner pode ver todos os risk states"
  ON public.security_risk_state
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Sistema pode inserir/atualizar risk states"
  ON public.security_risk_state
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5) Função para aplicar risco automaticamente
CREATE OR REPLACE FUNCTION public.fn_apply_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score INTEGER;
  lock_until TIMESTAMPTZ;
  lock_msg TEXT;
BEGIN
  -- Ignorar eventos sem user_id
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Inserir ou atualizar risk state
  INSERT INTO public.security_risk_state(user_id, risk_score, last_event_at, total_violations)
  VALUES (NEW.user_id, COALESCE((NEW.metadata->>'severity')::int, 10), now(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    risk_score = security_risk_state.risk_score + COALESCE((NEW.metadata->>'severity')::int, 10),
    last_event_at = now(),
    total_violations = security_risk_state.total_violations + 1,
    updated_at = now();

  -- Buscar score atualizado
  SELECT risk_score INTO new_score 
  FROM public.security_risk_state 
  WHERE user_id = NEW.user_id;

  -- Aplicar lock baseado no score
  IF new_score >= 500 THEN
    -- Lock permanente (até revisão manual)
    lock_until := now() + interval '30 days';
    lock_msg := 'CRITICAL: Score >= 500 - Lock 30 dias';
  ELSIF new_score >= 300 THEN
    -- Lock 24 horas
    lock_until := now() + interval '24 hours';
    lock_msg := 'SEVERE: Score >= 300 - Lock 24h';
  ELSIF new_score >= 150 THEN
    -- Lock 2 horas
    lock_until := now() + interval '2 hours';
    lock_msg := 'WARNING: Score >= 150 - Lock 2h';
  ELSIF new_score >= 100 THEN
    -- Lock 30 minutos
    lock_until := now() + interval '30 minutes';
    lock_msg := 'ALERT: Score >= 100 - Lock 30min';
  END IF;

  -- Aplicar lock se necessário
  IF lock_until IS NOT NULL THEN
    UPDATE public.security_risk_state 
    SET 
      locked_until = lock_until, 
      lock_reason = lock_msg,
      updated_at = now() 
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 6) Trigger no security_events
DROP TRIGGER IF EXISTS trg_apply_risk ON public.security_events;
CREATE TRIGGER trg_apply_risk
  AFTER INSERT ON public.security_events
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_apply_risk();

-- 7) Função helper para verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION public.fn_is_user_locked(p_user_id UUID)
RETURNS TABLE(
  is_locked BOOLEAN,
  locked_until TIMESTAMPTZ,
  lock_reason TEXT,
  risk_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(srs.locked_until > now(), false) AS is_locked,
    srs.locked_until,
    srs.lock_reason,
    COALESCE(srs.risk_score, 0) AS risk_score
  FROM public.security_risk_state srs
  WHERE srs.user_id = p_user_id;
  
  -- Se não encontrou registro, retorna desbloqueado
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, NULL::TEXT, 0;
  END IF;
END;
$$;

-- 8) Função para reset de risco (owner only)
CREATE OR REPLACE FUNCTION public.fn_reset_user_risk(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verificar se caller é owner
  SELECT role INTO caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid();
  
  IF caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Apenas owner/admin pode resetar risco';
  END IF;
  
  -- Resetar
  UPDATE public.security_risk_state
  SET 
    risk_score = 0,
    locked_until = NULL,
    lock_reason = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Logar ação
  INSERT INTO public.security_events(user_id, event_type, metadata)
  VALUES (
    p_user_id, 
    'RISK_RESET_BY_ADMIN',
    jsonb_build_object('reset_by', auth.uid(), 'reset_at', now())
  );
  
  RETURN true;
END;
$$;

-- 9) Comentários
COMMENT ON TABLE public.security_risk_state IS 'SANCTUM 3.0: Estado de risco por usuário com auto-lock';
COMMENT ON FUNCTION public.fn_apply_risk() IS 'Trigger que aplica risco automático baseado em security_events';
COMMENT ON FUNCTION public.fn_is_user_locked(UUID) IS 'Verifica se usuário está bloqueado por risco';
COMMENT ON FUNCTION public.fn_reset_user_risk(UUID) IS 'Reset de risco (owner only)';