-- ============================================
-- TRAMON v9.0 - FASE 1: FUNDAÇÃO DATA WAREHOUSE
-- Security Events, Dead Letter Queue, Idempotência
-- ============================================

-- 3.1.1 - SCHEMA DE SEGURANÇA E AUDITORIA

-- Tabela security_events para registrar eventos de segurança
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    source TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    payload JSONB,
    description TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela dead_letter_queue para eventos que falharam após 3 tentativas
CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    original_webhook_id UUID,
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_history JSONB[] DEFAULT '{}',
    last_error TEXT,
    retry_count INTEGER DEFAULT 0,
    reprocessed BOOLEAN DEFAULT false,
    reprocessed_at TIMESTAMPTZ,
    reprocessed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela audit_access_mismatches para discrepâncias pagou/acesso
CREATE TABLE IF NOT EXISTS public.audit_access_mismatches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_type TEXT NOT NULL CHECK (audit_type IN ('pagou_sem_acesso', 'acesso_sem_pagamento', 'dados_inconsistentes')),
    email TEXT NOT NULL,
    nome TEXT,
    wp_user_id INTEGER,
    hotmart_transaction_id TEXT,
    valor_pago DECIMAL(10,2),
    grupos_wordpress JSONB,
    status_hotmart TEXT,
    status_wordpress TEXT,
    acao_sugerida TEXT,
    acao_tomada TEXT,
    resolvido BOOLEAN DEFAULT false,
    resolvido_at TIMESTAMPTZ,
    resolvido_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.1.3 - IDEMPOTÊNCIA NA INGESTÃO
-- Adicionar external_event_id na webhooks_queue se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhooks_queue' 
        AND column_name = 'external_event_id'
    ) THEN
        ALTER TABLE public.webhooks_queue 
        ADD COLUMN external_event_id TEXT;
    END IF;
END $$;

-- Criar índice único para idempotência
DROP INDEX IF EXISTS idx_webhooks_queue_idempotency;
CREATE UNIQUE INDEX idx_webhooks_queue_idempotency 
ON public.webhooks_queue (source, external_event_id, event) 
WHERE external_event_id IS NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_dead_letter_queue_source ON public.dead_letter_queue(source);
CREATE INDEX IF NOT EXISTS idx_dead_letter_queue_created ON public.dead_letter_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_mismatches_type ON public.audit_access_mismatches(audit_type);
CREATE INDEX IF NOT EXISTS idx_audit_mismatches_email ON public.audit_access_mismatches(email);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_access_mismatches ENABLE ROW LEVEL SECURITY;

-- Policies para owner/admin
CREATE POLICY "Owner pode ver security_events" ON public.security_events
    FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner pode ver dead_letter_queue" ON public.dead_letter_queue
    FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner pode ver audit_mismatches" ON public.audit_access_mismatches
    FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_audit_mismatches_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_audit_mismatches_updated ON public.audit_access_mismatches;
CREATE TRIGGER trigger_audit_mismatches_updated
    BEFORE UPDATE ON public.audit_access_mismatches
    FOR EACH ROW EXECUTE FUNCTION public.update_audit_mismatches_timestamp();

-- Função para registrar evento de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT DEFAULT 'info',
    p_source TEXT DEFAULT 'system',
    p_description TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.security_events (event_type, severity, source, description, payload, ip_address)
    VALUES (p_event_type, p_severity, p_source, p_description, p_payload, p_ip_address)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Função para mover webhook para dead letter queue
CREATE OR REPLACE FUNCTION public.move_to_dead_letter_queue(
    p_webhook_id UUID,
    p_error TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_dlq_id UUID;
    v_webhook RECORD;
BEGIN
    SELECT * INTO v_webhook FROM public.webhooks_queue WHERE id = p_webhook_id;
    
    IF v_webhook IS NULL THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO public.dead_letter_queue (
        original_webhook_id, source, event_type, payload, 
        last_error, retry_count
    )
    VALUES (
        p_webhook_id, v_webhook.source, v_webhook.event, v_webhook.payload,
        p_error, COALESCE(v_webhook.retry_count, 0)
    )
    RETURNING id INTO v_dlq_id;
    
    -- Remove da fila principal
    DELETE FROM public.webhooks_queue WHERE id = p_webhook_id;
    
    RETURN v_dlq_id;
END;
$$;