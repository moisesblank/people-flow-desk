-- =============================================
-- STUDENT DISPATCH SYSTEM — STATE MACHINE + REALTIME (FIX)
-- =============================================

-- 1. Adicionar campos de state machine à tabela existente envios_correios
ALTER TABLE public.envios_correios 
  ADD COLUMN IF NOT EXISTS student_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_seen_via text,
  ADD COLUMN IF NOT EXISTS dispatch_state text DEFAULT 'not_sent';

-- 2. Índice para busca rápida por aluno
CREATE INDEX IF NOT EXISTS idx_envios_correios_aluno_state 
  ON public.envios_correios (aluno_id, dispatch_state);

-- 3. Criar tabela de auditoria de envios
CREATE TABLE IF NOT EXISTS public.dispatch_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id uuid NOT NULL REFERENCES public.envios_correios(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid,
  actor_role text,
  tracking_code text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Índice de auditoria
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_envio 
  ON public.dispatch_audit_log (envio_id, created_at DESC);

-- 5. RLS para dispatch_audit_log
ALTER TABLE public.dispatch_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.dispatch_audit_log;
DROP POLICY IF EXISTS "Students can view own dispatch audit" ON public.dispatch_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.dispatch_audit_log;
DROP POLICY IF EXISTS "Service can insert audit logs" ON public.dispatch_audit_log;

-- Admins podem ver toda auditoria
CREATE POLICY "Admins can view all audit logs" ON public.dispatch_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Alunos podem ver auditoria dos seus próprios envios
CREATE POLICY "Students can view own dispatch audit" ON public.dispatch_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.envios_correios e
      WHERE e.id = dispatch_audit_log.envio_id
        AND e.aluno_id = auth.uid()
    )
  );

-- Sistema pode inserir auditoria
CREATE POLICY "System can insert audit logs" ON public.dispatch_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 6. RLS para alunos verem seus próprios envios
DROP POLICY IF EXISTS "Students can view own dispatches" ON public.envios_correios;
DROP POLICY IF EXISTS "Students can update own dispatch seen status" ON public.envios_correios;

CREATE POLICY "Students can view own dispatches" ON public.envios_correios
  FOR SELECT TO authenticated
  USING (
    aluno_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 7. Alunos podem atualizar status de visualização dos seus envios
CREATE POLICY "Students can update own dispatch seen status" ON public.envios_correios
  FOR UPDATE TO authenticated
  USING (aluno_id = auth.uid())
  WITH CHECK (aluno_id = auth.uid());

-- 8. Habilitar Realtime apenas para envios_correios (notifications já está)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'envios_correios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.envios_correios;
  END IF;
END $$;

-- 9. Função para marcar envio como visto
CREATE OR REPLACE FUNCTION public.mark_dispatch_seen(
  p_envio_id uuid,
  p_seen_via text DEFAULT 'tracking_click'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id uuid;
  v_current_state text;
BEGIN
  SELECT aluno_id, dispatch_state INTO v_aluno_id, v_current_state
  FROM envios_correios
  WHERE id = p_envio_id;
  
  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Envio não encontrado';
  END IF;
  
  IF v_aluno_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  IF v_current_state != 'sent_confirmed' THEN
    RETURN false;
  END IF;
  
  UPDATE envios_correios
  SET 
    dispatch_state = 'seen_by_student',
    student_seen_at = now(),
    student_seen_via = p_seen_via
  WHERE id = p_envio_id
    AND dispatch_state = 'sent_confirmed';
  
  INSERT INTO dispatch_audit_log (envio_id, event_type, actor_id, actor_role, metadata)
  VALUES (p_envio_id, 'student_acknowledged', auth.uid(), 'student', 
    jsonb_build_object('seen_via', p_seen_via, 'seen_at', now()));
  
  RETURN true;
END;
$$;

-- 10. Atualizar envios existentes com código de rastreio para state 'sent_confirmed'
UPDATE public.envios_correios 
SET dispatch_state = 'sent_confirmed'
WHERE codigo_rastreio IS NOT NULL 
  AND codigo_rastreio_validado = true
  AND (dispatch_state IS NULL OR dispatch_state = 'not_sent');