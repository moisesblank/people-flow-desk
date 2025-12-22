-- ============================================
-- 🛡️ FORTALEZA DIGITAL - CLEANUP E RECRIAÇÃO
-- ============================================

-- 1. DROP TODAS as versões das funções conflitantes
DROP FUNCTION IF EXISTS public.check_webhook_idempotency_v2(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_webhook_idempotency_v2(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_webhook_idempotency_v2(TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.mark_webhook_processed_v2(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.mark_webhook_processed_v2(TEXT, TEXT, JSONB);

-- 2. Criar funções com nomes únicos
CREATE OR REPLACE FUNCTION public.webhook_check_duplicate(
    p_provider TEXT,
    p_event_id TEXT,
    p_event_type TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_existing RECORD; v_new_id UUID;
BEGIN
    SELECT * INTO v_existing FROM public.webhook_events WHERE provider = p_provider AND event_id = p_event_id;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('is_duplicate', true, 'status', v_existing.status, 'original_id', v_existing.id);
    END IF;
    INSERT INTO public.webhook_events (provider, event_id, event_type, payload, status)
    VALUES (p_provider, p_event_id, p_event_type, p_payload, 'processing') RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('is_duplicate', false, 'status', 'processing', 'event_id', v_new_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.webhook_mark_done(
    p_provider TEXT, 
    p_event_id TEXT, 
    p_response JSONB DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.webhook_events SET status = 'processed', processed_at = now(), response = p_response 
    WHERE provider = p_provider AND event_id = p_event_id;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.webhook_mark_failed(
    p_provider TEXT, 
    p_event_id TEXT, 
    p_error TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.webhook_events 
    SET status = 'failed', last_error = p_error, attempts = attempts + 1 
    WHERE provider = p_provider AND event_id = p_event_id;
    RETURN FOUND;
END;
$$;

-- 3. Função de limpeza de rate limits antigos
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.rate_limit_state 
        WHERE updated_at < now() - INTERVAL '1 hour'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$;

-- 4. Função de limpeza de webhooks antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_webhooks()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.webhook_events 
        WHERE received_at < now() - INTERVAL '30 days'
        AND status IN ('processed', 'ignored', 'duplicate')
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$;

-- 5. Comentários
COMMENT ON FUNCTION public.webhook_check_duplicate IS 'Verifica duplicidade de webhook - LEI III';
COMMENT ON FUNCTION public.webhook_mark_done IS 'Marca webhook como processado - LEI III';
COMMENT ON FUNCTION public.webhook_mark_failed IS 'Marca webhook como falha - LEI III';
COMMENT ON FUNCTION public.cleanup_rate_limits IS 'Limpa rate limits antigos - LEI III';
COMMENT ON FUNCTION public.cleanup_old_webhooks IS 'Limpa webhooks antigos - LEI III';