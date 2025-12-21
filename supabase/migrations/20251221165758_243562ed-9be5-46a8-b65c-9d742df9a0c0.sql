-- ============================================
-- TESTAMENTO DA SINGULARIDADE v5.0 - PARTE 1
-- O GENOMA DIVINO: Sistema Nervoso Central
-- Arquitetura Event-Driven (Divindade Digital)
-- ============================================

-- 1. ENUMS PARA EVENTOS (Sistema Nervoso)
CREATE TYPE public.event_name AS ENUM (
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
  'lesson.started',
  'lesson.completed',
  'quiz.started',
  'quiz.passed',
  'quiz.failed',
  'correct.answer',
  'wrong.answer',
  'daily.login',
  'streak.achieved',
  'level.up',
  'badge.earned',
  'certificate.generated',
  'access.granted',
  'access.expired',
  'access.revoked',
  'user.registered',
  'user.upgraded',
  'churn.risk.detected',
  'ai.prediction.made',
  'webhook.received',
  'notification.sent',
  'content.viewed'
);

CREATE TYPE public.event_status AS ENUM ('pending', 'processing', 'processed', 'failed', 'retrying');

-- 2. TABELA CENTRAL DE EVENTOS (O SISTEMA NERVOSO DIVINO)
CREATE TABLE public.events (
  id BIGSERIAL PRIMARY KEY,
  name event_name NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id TEXT,
  status event_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices otimizados para consumidores (Lei I: Velocidade)
CREATE INDEX idx_events_status_pending ON public.events(status) WHERE status = 'pending';
CREATE INDEX idx_events_status_created ON public.events(status, created_at);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_name ON public.events(name);
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id);

-- Habilitar RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Owner pode ver todos eventos"
  ON public.events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Usuários veem próprios eventos"
  ON public.events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema pode inserir eventos"
  ON public.events FOR INSERT
  WITH CHECK (true);

-- 3. TABELA DE REGRAS DE XP (Gamificação via Eventos)
CREATE TABLE public.xp_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action event_name NOT NULL UNIQUE,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  multiplier_streak NUMERIC(3,2) DEFAULT 1.0,
  max_daily_occurrences INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir regras de XP padrão
INSERT INTO public.xp_rules (action, xp_amount, description, multiplier_streak, max_daily_occurrences) VALUES
  ('correct.answer', 10, 'Resposta correta em exercício', 1.1, 100),
  ('wrong.answer', 2, 'Tentativa em exercício', 1.0, 100),
  ('lesson.started', 5, 'Iniciou uma aula', 1.0, 20),
  ('lesson.completed', 50, 'Completou uma aula', 1.2, 10),
  ('quiz.started', 10, 'Iniciou um quiz', 1.0, 10),
  ('quiz.passed', 100, 'Passou no quiz', 1.5, 5),
  ('quiz.failed', 15, 'Tentou quiz (não passou)', 1.0, 5),
  ('daily.login', 25, 'Login diário', 1.3, 1),
  ('streak.achieved', 50, 'Manteve sequência de dias', 2.0, 1),
  ('level.up', 200, 'Subiu de nível', 1.0, NULL),
  ('badge.earned', 150, 'Conquistou uma badge', 1.0, NULL),
  ('certificate.generated', 500, 'Gerou certificado', 1.0, NULL),
  ('content.viewed', 3, 'Visualizou conteúdo', 1.0, 50);

-- RLS para xp_rules
ALTER TABLE public.xp_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver regras de XP"
  ON public.xp_rules FOR SELECT
  USING (true);

CREATE POLICY "Owner pode gerenciar regras"
  ON public.xp_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner'));

-- 4. TABELA DE PROCESSAMENTO DE EVENTOS (Log de Consumidores)
CREATE TABLE public.event_consumers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_name TEXT NOT NULL,
  event_types event_name[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_processed_event_id BIGINT,
  last_processed_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrar consumidores padrão
INSERT INTO public.event_consumers (consumer_name, event_types) VALUES
  ('xp_processor', ARRAY['correct.answer', 'lesson.completed', 'quiz.passed', 'daily.login', 'streak.achieved', 'level.up', 'badge.earned']::event_name[]),
  ('notification_sender', ARRAY['payment.succeeded', 'payment.failed', 'access.expired', 'badge.earned', 'certificate.generated']::event_name[]),
  ('churn_predictor', ARRAY['daily.login', 'lesson.completed', 'access.expired']::event_name[]),
  ('webhook_processor', ARRAY['webhook.received', 'payment.succeeded', 'payment.refunded']::event_name[]),
  ('access_manager', ARRAY['payment.succeeded', 'access.granted', 'access.expired', 'access.revoked']::event_name[]);

-- 5. FUNÇÃO PARA PUBLICAR EVENTO (API do Sistema Nervoso)
CREATE OR REPLACE FUNCTION public.publish_event(
  p_name event_name,
  p_payload JSONB DEFAULT '{}',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id BIGINT;
BEGIN
  INSERT INTO public.events (name, payload, user_id, entity_type, entity_id)
  VALUES (p_name, p_payload, auth.uid(), p_entity_type, p_entity_id)
  RETURNING id INTO v_event_id;
  
  -- Log de auditoria
  INSERT INTO public.audit_logs (action, table_name, record_id, new_data, user_id)
  VALUES ('EVENT_PUBLISHED', 'events', v_event_id::TEXT, 
          jsonb_build_object('event_name', p_name, 'entity', p_entity_type || ':' || p_entity_id),
          auth.uid());
  
  RETURN v_event_id;
END;
$$;

-- 6. FUNÇÃO PARA PROCESSAR PRÓXIMO EVENTO (Para consumidores)
CREATE OR REPLACE FUNCTION public.claim_next_event(
  p_consumer_name TEXT,
  p_event_types event_name[]
)
RETURNS TABLE (
  event_id BIGINT,
  event_name event_name,
  payload JSONB,
  user_id UUID,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
BEGIN
  -- Buscar e marcar próximo evento pendente
  SELECT e.* INTO v_event
  FROM public.events e
  WHERE e.status = 'pending'
    AND e.name = ANY(p_event_types)
    AND e.retry_count < e.max_retries
  ORDER BY e.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF v_event IS NULL THEN
    RETURN;
  END IF;
  
  -- Marcar como processando
  UPDATE public.events SET
    status = 'processing',
    processed_by = p_consumer_name,
    updated_at = NOW()
  WHERE id = v_event.id;
  
  -- Retornar evento
  RETURN QUERY SELECT 
    v_event.id,
    v_event.name,
    v_event.payload,
    v_event.user_id,
    v_event.entity_type,
    v_event.entity_id,
    v_event.created_at;
END;
$$;

-- 7. FUNÇÃO PARA MARCAR EVENTO COMO PROCESSADO
CREATE OR REPLACE FUNCTION public.complete_event(
  p_event_id BIGINT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_success THEN
    UPDATE public.events SET
      status = 'processed',
      processed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_event_id;
  ELSE
    UPDATE public.events SET
      status = CASE 
        WHEN retry_count + 1 >= max_retries THEN 'failed'::event_status
        ELSE 'retrying'::event_status
      END,
      retry_count = retry_count + 1,
      error_message = p_error_message,
      updated_at = NOW()
    WHERE id = p_event_id;
  END IF;
  
  RETURN true;
END;
$$;

-- 8. FUNÇÃO PARA PROCESSAR XP AUTOMATICAMENTE (Trigger interno)
CREATE OR REPLACE FUNCTION public.process_xp_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_amount INTEGER;
  v_multiplier NUMERIC;
  v_final_xp INTEGER;
  v_current_streak INTEGER;
BEGIN
  -- Buscar regra de XP para este evento
  SELECT xp_amount, multiplier_streak INTO v_xp_amount, v_multiplier
  FROM public.xp_rules
  WHERE action = NEW.name AND is_active = true;
  
  IF v_xp_amount IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar streak atual do usuário
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM public.user_gamification
  WHERE user_id = NEW.user_id;
  
  -- Calcular XP final com multiplicador de streak
  v_final_xp := ROUND(v_xp_amount * POWER(v_multiplier, LEAST(v_current_streak, 10)));
  
  -- Adicionar XP ao usuário
  PERFORM public.add_user_xp(
    NEW.user_id,
    v_final_xp,
    NEW.name::TEXT,
    NULL,
    'Auto-processed from event #' || NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para processar XP automaticamente quando evento é marcado como processado
CREATE TRIGGER trigger_process_xp_on_event
  AFTER UPDATE ON public.events
  FOR EACH ROW
  WHEN (OLD.status = 'processing' AND NEW.status = 'processed')
  EXECUTE FUNCTION public.process_xp_event();

-- 9. ATUALIZAR RLS PARA LESSONS (Acesso BETA apenas)
DROP POLICY IF EXISTS "Betas can read lessons" ON public.lessons;
CREATE POLICY "Acesso BETA a aulas"
  ON public.lessons FOR SELECT
  USING (
    -- Owner/Admin sempre acessa
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
    OR
    -- BETA com acesso válido
    (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'beta')
      AND EXISTS (
        SELECT 1 FROM public.user_access_expiration 
        WHERE user_id = auth.uid() 
          AND is_active = true 
          AND access_end_date > NOW()
      )
    )
  );

-- 10. HABILITAR REALTIME PARA EVENTOS
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_rules;