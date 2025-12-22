
-- ============================================
-- 🔥 MIGRAÇÃO: Sistema de Chat para Lives v2.0
-- Suporte a 5.000+ usuários simultâneos
-- ============================================

-- ============================================
-- 1. TABELAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    user_role TEXT NOT NULL DEFAULT 'viewer' CHECK (user_role IN ('owner', 'admin', 'moderator', 'beta', 'viewer')),
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_chat_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    is_ban BOOLEAN NOT NULL DEFAULT false,
    timeout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(live_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.live_chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL UNIQUE,
    slow_mode BOOLEAN NOT NULL DEFAULT false,
    slow_mode_interval INTEGER NOT NULL DEFAULT 2000,
    subscribers_only BOOLEAN NOT NULL DEFAULT false,
    chat_enabled BOOLEAN NOT NULL DEFAULT true,
    min_account_age_days INTEGER NOT NULL DEFAULT 0,
    blocked_words TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_created 
    ON public.live_chat_messages(live_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_user 
    ON public.live_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_pinned 
    ON public.live_chat_messages(live_id) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_live_chat_bans_live_user 
    ON public.live_chat_bans(live_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_bans_timeout 
    ON public.live_chat_bans(timeout_until) WHERE timeout_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_chat_bans_permanent 
    ON public.live_chat_bans(live_id, user_id) WHERE is_ban = true;

-- ============================================
-- 3. TRIGGERS: updated_at automático
-- ============================================
DROP TRIGGER IF EXISTS update_live_chat_messages_updated_at ON public.live_chat_messages;
CREATE TRIGGER update_live_chat_messages_updated_at
    BEFORE UPDATE ON public.live_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_chat_bans_updated_at ON public.live_chat_bans;
CREATE TRIGGER update_live_chat_bans_updated_at
    BEFORE UPDATE ON public.live_chat_bans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_chat_settings_updated_at ON public.live_chat_settings;
CREATE TRIGGER update_live_chat_settings_updated_at
    BEFORE UPDATE ON public.live_chat_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNÇÕES (ANTES DAS POLICIES!)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_user_banned_from_chat(
    p_live_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.live_chat_bans
        WHERE live_id = p_live_id
        AND user_id = p_user_id
        AND (
            is_ban = true 
            OR (timeout_until IS NOT NULL AND timeout_until > now())
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_chat_ban_status(
    p_live_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    is_banned BOOLEAN,
    is_timed_out BOOLEAN,
    timeout_until TIMESTAMPTZ,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.is_ban as is_banned,
        CASE WHEN b.timeout_until IS NOT NULL AND b.timeout_until > now() THEN true ELSE false END as is_timed_out,
        b.timeout_until,
        b.reason
    FROM public.live_chat_bans b
    WHERE b.live_id = p_live_id
    AND b.user_id = p_user_id
    AND (b.is_ban = true OR (b.timeout_until IS NOT NULL AND b.timeout_until > now()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.live_chat_messages
        WHERE created_at < now() - INTERVAL '7 days'
        AND is_pinned = false
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_expired_timeouts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.live_chat_bans
        WHERE is_ban = false
        AND timeout_until IS NOT NULL
        AND timeout_until < now()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 5. RLS: Row Level Security
-- ============================================
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "chat_messages_select" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_bans_select" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_insert" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_update" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_bans_delete" ON public.live_chat_bans;
DROP POLICY IF EXISTS "chat_settings_select" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_insert" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_update" ON public.live_chat_settings;
DROP POLICY IF EXISTS "chat_settings_delete" ON public.live_chat_settings;

-- Políticas para live_chat_messages
CREATE POLICY "chat_messages_select" ON public.live_chat_messages
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND (is_deleted = false OR auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()))
    );

CREATE POLICY "chat_messages_insert" ON public.live_chat_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND NOT public.is_user_banned_from_chat(live_id, auth.uid())
    );

CREATE POLICY "chat_messages_update" ON public.live_chat_messages
    FOR UPDATE
    USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_messages_delete" ON public.live_chat_messages
    FOR DELETE
    USING (public.is_owner(auth.uid()));

-- Políticas para live_chat_bans
CREATE POLICY "chat_bans_select" ON public.live_chat_bans
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_bans_insert" ON public.live_chat_bans
    FOR INSERT
    WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_bans_update" ON public.live_chat_bans
    FOR UPDATE
    USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_bans_delete" ON public.live_chat_bans
    FOR DELETE
    USING (public.is_admin_or_owner(auth.uid()));

-- Políticas para live_chat_settings
CREATE POLICY "chat_settings_select" ON public.live_chat_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "chat_settings_insert" ON public.live_chat_settings
    FOR INSERT
    WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_settings_update" ON public.live_chat_settings
    FOR UPDATE
    USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "chat_settings_delete" ON public.live_chat_settings
    FOR DELETE
    USING (public.is_owner(auth.uid()));

-- ============================================
-- 6. REALTIME
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'live_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'live_chat_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_settings;
    END IF;
END $$;

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.live_chat_messages IS 'Mensagens do chat de lives - suporte a 5000+ simultâneos';
COMMENT ON TABLE public.live_chat_bans IS 'Banimentos e timeouts do chat de lives';
COMMENT ON TABLE public.live_chat_settings IS 'Configurações do chat por live (slow mode, etc)';
