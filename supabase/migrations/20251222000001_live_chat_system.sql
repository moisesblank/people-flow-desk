-- ============================================
-- 🔥 MIGRAÇÃO: Sistema de Chat para Lives v2.0
-- Suporte a 5.000+ usuários simultâneos
-- Design 2300 - Escalável, Performático e Seguro
-- ============================================

-- ============================================
-- 1. TABELA: live_chat_messages
-- Mensagens do chat em tempo real
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

-- ============================================
-- 2. TABELA: live_chat_bans
-- Banimentos e timeouts do chat
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_chat_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    is_ban BOOLEAN NOT NULL DEFAULT false, -- true = ban permanente, false = timeout
    timeout_until TIMESTAMPTZ, -- Para timeouts, quando expira
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(live_id, user_id)
);

-- ============================================
-- 3. TABELA: live_chat_settings
-- Configurações do chat por live
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL UNIQUE,
    slow_mode BOOLEAN NOT NULL DEFAULT false,
    slow_mode_interval INTEGER NOT NULL DEFAULT 2000, -- ms
    subscribers_only BOOLEAN NOT NULL DEFAULT false,
    chat_enabled BOOLEAN NOT NULL DEFAULT true,
    min_account_age_days INTEGER NOT NULL DEFAULT 0,
    blocked_words TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. ÍNDICES OTIMIZADOS PARA PERFORMANCE
-- ============================================

-- Índices para live_chat_messages (consultas frequentes)
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_id 
    ON public.live_chat_messages(live_id);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created_at 
    ON public.live_chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_created 
    ON public.live_chat_messages(live_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_user_id 
    ON public.live_chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_is_pinned 
    ON public.live_chat_messages(live_id) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_not_deleted 
    ON public.live_chat_messages(live_id, created_at DESC) WHERE is_deleted = false;

-- Índices para live_chat_bans
CREATE INDEX IF NOT EXISTS idx_live_chat_bans_live_user 
    ON public.live_chat_bans(live_id, user_id);

CREATE INDEX IF NOT EXISTS idx_live_chat_bans_timeout 
    ON public.live_chat_bans(timeout_until) WHERE timeout_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_live_chat_bans_active 
    ON public.live_chat_bans(live_id, user_id) WHERE is_ban = true OR timeout_until > now();

-- ============================================
-- 5. TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- 6. RLS: Row Level Security
-- ============================================

-- Habilitar RLS
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Moderators can update messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Moderators can view bans" ON public.live_chat_bans;
DROP POLICY IF EXISTS "Moderators can create bans" ON public.live_chat_bans;
DROP POLICY IF EXISTS "Admins can manage bans" ON public.live_chat_bans;
DROP POLICY IF EXISTS "Users can view chat settings" ON public.live_chat_settings;
DROP POLICY IF EXISTS "Admins can manage chat settings" ON public.live_chat_settings;

-- Políticas para live_chat_messages

-- SELECT: Qualquer usuário autenticado pode ver mensagens não deletadas
CREATE POLICY "chat_messages_select" ON public.live_chat_messages
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND (is_deleted = false OR auth.uid() = user_id)
    );

-- INSERT: Usuários autenticados podem enviar (se não banidos - verificado pela função)
CREATE POLICY "chat_messages_insert" ON public.live_chat_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.live_chat_bans b
            WHERE b.live_id = live_chat_messages.live_id
            AND b.user_id = auth.uid()
            AND (b.is_ban = true OR (b.timeout_until IS NOT NULL AND b.timeout_until > now()))
        )
    );

-- UPDATE: Apenas moderadores/admins podem atualizar (deletar, fixar)
CREATE POLICY "chat_messages_update" ON public.live_chat_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- DELETE: Apenas owner pode deletar permanentemente
CREATE POLICY "chat_messages_delete" ON public.live_chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'owner'
        )
    );

-- Políticas para live_chat_bans

-- SELECT: Moderadores podem ver bans, usuário pode ver próprio ban
CREATE POLICY "chat_bans_select" ON public.live_chat_bans
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- INSERT: Moderadores podem criar bans
CREATE POLICY "chat_bans_insert" ON public.live_chat_bans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- UPDATE: Apenas admins
CREATE POLICY "chat_bans_update" ON public.live_chat_bans
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- DELETE: Apenas admins podem remover bans
CREATE POLICY "chat_bans_delete" ON public.live_chat_bans
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Políticas para live_chat_settings

-- SELECT: Qualquer autenticado pode ver settings
CREATE POLICY "chat_settings_select" ON public.live_chat_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: Apenas admins
CREATE POLICY "chat_settings_insert" ON public.live_chat_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "chat_settings_update" ON public.live_chat_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "chat_settings_delete" ON public.live_chat_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'owner'
        )
    );

-- ============================================
-- 7. FUNÇÃO: Verificar se usuário está banido
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO: Obter status de ban/timeout do usuário
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNÇÃO: Limpar mensagens antigas (retenção 7 dias)
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. FUNÇÃO: Limpar timeouts expirados
-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. REALTIME: Habilitar publicação
-- ============================================
DO $$
BEGIN
    -- Adicionar tabelas ao Realtime se ainda não estiverem
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
-- 12. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.live_chat_messages IS 'Mensagens do chat de lives - suporte a 5000+ simultâneos';
COMMENT ON TABLE public.live_chat_bans IS 'Banimentos e timeouts do chat de lives';
COMMENT ON TABLE public.live_chat_settings IS 'Configurações do chat por live (slow mode, etc)';
COMMENT ON FUNCTION public.is_user_banned_from_chat IS 'Verifica se usuário está banido/timeout de um chat';
COMMENT ON FUNCTION public.get_user_chat_ban_status IS 'Retorna detalhes do status de ban/timeout';
COMMENT ON FUNCTION public.cleanup_old_chat_messages IS 'Limpa mensagens com mais de 7 dias (exceto pinadas)';
COMMENT ON FUNCTION public.cleanup_expired_timeouts IS 'Remove timeouts expirados da tabela de bans';
