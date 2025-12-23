-- ============================================
-- 🔥 FASE 4: CONTROLES C060-C064 (Vídeo + PDF) - CORREÇÃO
-- Melhorias em signed URLs, watermark e logs
-- ============================================

-- C060: Adicionar validação de domínio em video_sessions
ALTER TABLE IF EXISTS public.video_sessions
ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT ARRAY['moisesmedeiros.com.br', 'pro.moisesmedeiros.com.br', 'gestao.moisesmedeiros.com.br'];

-- C061: Tabela de configuração de segurança por tipo de conteúdo
CREATE TABLE IF NOT EXISTS public.content_security_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'material', 'book')),
    ttl_seconds INTEGER NOT NULL DEFAULT 900,
    max_concurrent_sessions INTEGER DEFAULT 2,
    require_watermark BOOLEAN DEFAULT true,
    allowed_domains TEXT[] DEFAULT ARRAY['moisesmedeiros.com.br'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(content_type)
);

-- Inserir configurações padrão
INSERT INTO public.content_security_config (content_type, ttl_seconds, max_concurrent_sessions, require_watermark, allowed_domains)
VALUES 
    ('video', 900, 2, true, ARRAY['moisesmedeiros.com.br', 'pro.moisesmedeiros.com.br']),
    ('pdf', 300, 1, true, ARRAY['moisesmedeiros.com.br', 'pro.moisesmedeiros.com.br']),
    ('book', 180, 1, true, ARRAY['moisesmedeiros.com.br', 'pro.moisesmedeiros.com.br']),
    ('material', 600, 3, false, ARRAY['moisesmedeiros.com.br', 'pro.moisesmedeiros.com.br'])
ON CONFLICT (content_type) DO UPDATE SET
    ttl_seconds = EXCLUDED.ttl_seconds,
    updated_at = now();

-- RLS para content_security_config
ALTER TABLE public.content_security_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_security_config_select" ON public.content_security_config;
CREATE POLICY "content_security_config_select" ON public.content_security_config
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "content_security_config_admin_all" ON public.content_security_config;
CREATE POLICY "content_security_config_admin_all" ON public.content_security_config
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.email = 'moisesblank@gmail.com'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin')
        )
    );

-- C062/C063: Função para gerar watermark hash único
CREATE OR REPLACE FUNCTION public.generate_content_watermark(
    p_user_id UUID,
    p_content_id UUID,
    p_content_type TEXT
)
RETURNS TABLE(
    watermark_text TEXT,
    watermark_hash TEXT,
    timestamp_bucket BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_bucket BIGINT;
    v_raw_text TEXT;
BEGIN
    -- Obter dados do perfil
    SELECT nome, cpf, email INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    -- Bucket de 20 segundos para variação
    v_bucket := (EXTRACT(EPOCH FROM now())::BIGINT / 20) * 20;

    -- Montar texto de watermark
    v_raw_text := COALESCE(
        SUBSTRING(v_profile.email FROM 1 FOR 8) || '***' || 
        SUBSTRING(p_user_id::TEXT FROM 1 FOR 8) || '-' ||
        v_bucket::TEXT,
        p_user_id::TEXT || '-' || v_bucket::TEXT
    );

    RETURN QUERY SELECT
        v_raw_text AS watermark_text,
        ENCODE(SHA256(v_raw_text::BYTEA), 'hex') AS watermark_hash,
        v_bucket AS timestamp_bucket;
END;
$$;

-- C064: Função para log de acesso com detecção de anomalia
CREATE OR REPLACE FUNCTION public.log_content_access(
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id UUID,
    p_action TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_recent_count INTEGER;
    v_is_anomaly BOOLEAN := false;
BEGIN
    -- Verificar acesso recente anômalo (mais de 10 acessos em 1 minuto)
    SELECT COUNT(*) INTO v_recent_count
    FROM public.content_access_log
    WHERE user_id = p_user_id
      AND content_type = p_content_type
      AND created_at > now() - INTERVAL '1 minute';

    IF v_recent_count > 10 THEN
        v_is_anomaly := true;
        -- Inserir alerta de segurança
        INSERT INTO public.security_events (
            event_type, severity, user_id, payload
        ) VALUES (
            'content_access_anomaly',
            'warn',
            p_user_id,
            jsonb_build_object(
                'content_type', p_content_type,
                'content_id', p_content_id,
                'recent_access_count', v_recent_count
            )
        );
    END IF;

    -- Inserir log
    INSERT INTO public.content_access_log (
        user_id, content_type, content_id, action, 
        metadata, success
    ) VALUES (
        p_user_id, p_content_type, p_content_id, p_action,
        p_metadata || jsonb_build_object('is_anomaly', v_is_anomaly),
        true
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Função para validar domínio de acesso
CREATE OR REPLACE FUNCTION public.validate_content_domain(
    p_content_type TEXT,
    p_request_domain TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_allowed_domains TEXT[];
BEGIN
    SELECT allowed_domains INTO v_allowed_domains
    FROM public.content_security_config
    WHERE content_type = p_content_type;

    IF v_allowed_domains IS NULL THEN
        RETURN true;
    END IF;

    RETURN p_request_domain = ANY(v_allowed_domains) OR
           p_request_domain LIKE '%.moisesmedeiros.com.br' OR
           p_request_domain IN ('localhost', '127.0.0.1');
END;
$$;

-- Função para obter TTL de conteúdo
CREATE OR REPLACE FUNCTION public.get_content_ttl(p_content_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ttl INTEGER;
BEGIN
    SELECT ttl_seconds INTO v_ttl
    FROM public.content_security_config
    WHERE content_type = p_content_type;

    RETURN COALESCE(v_ttl, 900);
END;
$$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_content_access_log_anomaly 
ON public.content_access_log (user_id, content_type, created_at);

CREATE INDEX IF NOT EXISTS idx_content_security_config_type 
ON public.content_security_config (content_type);