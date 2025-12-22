-- ============================================
-- 🔥 MIGRAÇÃO: Sistema de Chat para Lives
-- Suporte a 5.000 usuários simultâneos
-- Design 2300 - Escalável e Performático
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
    ban_type TEXT NOT NULL DEFAULT 'timeout' CHECK (ban_type IN ('timeout', 'ban')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(live_id, user_id)
);

-- ============================================
-- 3. TABELA: live_chat_settings
-- Configurações do chat por live
-- ============================================
CREATE TABLE IF NOT EXISTS public.live_chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_id UUID NOT NULL UNIQUE,
    slow_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    slow_mode_interval INTEGER NOT NULL DEFAULT 2000, -- ms
    subscribers_only BOOLEAN NOT NULL DEFAULT false,
    min_account_age_days INTEGER NOT NULL DEFAULT 0,
    blocked_words TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. ÍNDICES OTIMIZADOS PARA PERFORMANCE
-- ============================================

-- Índices para live_chat_messages
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

-- Índices para live_chat_bans
CREATE INDEX IF NOT EXISTS idx_live_chat_bans_live_user 
    ON public.live_chat_bans(live_id, user_id);

CREATE INDEX IF NOT EXISTS idx_live_chat_bans_expires 
    ON public.live_chat_bans(expires_at) WHERE expires_at IS NOT NULL;

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

-- Políticas para live_chat_messages

-- SELECT: Qualquer usuário autenticado pode ver mensagens não deletadas
CREATE POLICY "Users can view chat messages" ON public.live_chat_messages
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND (is_deleted = false OR auth.uid() = user_id)
    );

-- INSERT: Usuários autenticados podem enviar mensagens
CREATE POLICY "Users can send chat messages" ON public.live_chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Apenas moderadores/admins podem atualizar (deletar, fixar)
CREATE POLICY "Moderators can update messages" ON public.live_chat_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- DELETE: Apenas admins podem deletar permanentemente
CREATE POLICY "Admins can delete messages" ON public.live_chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'owner'
        )
    );

-- Políticas para live_chat_bans

-- SELECT: Moderadores podem ver bans
CREATE POLICY "Moderators can view bans" ON public.live_chat_bans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
        OR auth.uid() = user_id -- Usuário pode ver próprio ban
    );

-- INSERT: Moderadores podem criar bans
CREATE POLICY "Moderators can create bans" ON public.live_chat_bans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- UPDATE/DELETE: Apenas admins
CREATE POLICY "Admins can manage bans" ON public.live_chat_bans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'owner'
        )
    );

-- Políticas para live_chat_settings

-- SELECT: Qualquer autenticado pode ver settings
CREATE POLICY "Users can view chat settings" ON public.live_chat_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: Apenas admins
CREATE POLICY "Admins can manage chat settings" ON public.live_chat_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
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
            ban_type = 'ban' 
            OR (ban_type = 'timeout' AND expires_at > now())
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO: Limpar mensagens antigas (retenção)
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
-- 9. REALTIME: Habilitar publicação
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.live_chat_messages IS 'Mensagens do chat de lives - suporte a 5000 simultâneos';
COMMENT ON TABLE public.live_chat_bans IS 'Banimentos e timeouts do chat';
COMMENT ON TABLE public.live_chat_settings IS 'Configurações do chat por live';
COMMENT ON FUNCTION public.is_user_banned_from_chat IS 'Verifica se usuário está banido/timeout de um chat';
COMMENT ON FUNCTION public.cleanup_old_chat_messages IS 'Limpa mensagens com mais de 7 dias';
