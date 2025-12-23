-- ============================================
-- FASE 3: C044 — CORRELATION-ID EM WEBHOOKS
-- Gate V020/V021: Rastreabilidade completa
-- ============================================

-- 1) Adicionar correlation_id à webhooks_queue
ALTER TABLE public.webhooks_queue 
ADD COLUMN IF NOT EXISTS correlation_id UUID DEFAULT gen_random_uuid();

-- 2) Adicionar correlation_id à webhook_events
ALTER TABLE public.webhook_events 
ADD COLUMN IF NOT EXISTS correlation_id UUID DEFAULT gen_random_uuid();

-- 3) Adicionar correlation_id à webhook_events_v2
ALTER TABLE public.webhook_events_v2 
ADD COLUMN IF NOT EXISTS correlation_id UUID DEFAULT gen_random_uuid();

-- 4) Criar índices para busca por correlation_id
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_correlation ON public.webhooks_queue(correlation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_correlation ON public.webhook_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_v2_correlation ON public.webhook_events_v2(correlation_id);

-- 5) Função helper para gerar correlation_id
CREATE OR REPLACE FUNCTION public.generate_correlation_id()
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT gen_random_uuid();
$$;

-- 6) Atualizar função de idempotência para retornar correlation_id
CREATE OR REPLACE FUNCTION public.check_webhook_idempotency_v4(
    p_provider TEXT, 
    p_event_id TEXT, 
    p_event_type TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL, 
    p_ip_address TEXT DEFAULT NULL, 
    p_signature_valid BOOLEAN DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE 
  v_existing RECORD;
  v_new_correlation_id UUID;
BEGIN
    v_new_correlation_id := COALESCE(p_correlation_id, gen_random_uuid());
    
    SELECT * INTO v_existing 
    FROM public.webhook_events 
    WHERE provider = p_provider AND event_id = p_event_id;
    
    IF v_existing IS NOT NULL THEN
        UPDATE public.webhook_events 
        SET status = 'duplicate', attempts = attempts + 1 
        WHERE id = v_existing.id;
        
        RETURN jsonb_build_object(
            'is_duplicate', true, 
            'original_id', v_existing.id,
            'correlation_id', v_existing.correlation_id
        );
    END IF;
    
    INSERT INTO public.webhook_events (
        provider, event_id, event_type, payload, 
        ip_address, signature_valid, correlation_id
    )
    VALUES (
        p_provider, p_event_id, p_event_type, p_payload, 
        p_ip_address::INET, p_signature_valid, v_new_correlation_id
    );
    
    RETURN jsonb_build_object(
        'is_duplicate', false, 
        'event_id', p_event_id,
        'correlation_id', v_new_correlation_id
    );
END;
$$;

-- 7) Log de auditoria
INSERT INTO public.security_audit_log (action, action_category, table_name, metadata, severity)
VALUES (
  'FASE_3_CORRELATION_ID_IMPLEMENTED',
  'security',
  'webhooks_queue',
  jsonb_build_object(
    'fase', 'FASE 3',
    'controle', 'C044',
    'descricao', 'Correlation-ID adicionado a todas tabelas de webhook',
    'tabelas_atualizadas', ARRAY['webhooks_queue', 'webhook_events', 'webhook_events_v2'],
    'funcao_criada', 'check_webhook_idempotency_v4'
  ),
  'info'
);