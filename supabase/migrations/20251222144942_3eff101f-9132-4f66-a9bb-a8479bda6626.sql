-- ============================================
-- COMPLETAR: Funções, Triggers e Realtime
-- (Tabelas, índices e policies já existem)
-- ============================================

-- Funções auxiliares
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

-- Comentários
COMMENT ON TABLE public.live_chat_messages IS 'Mensagens do chat de lives - suporte a 5000+ simultâneos';
COMMENT ON TABLE public.live_chat_bans IS 'Banimentos e timeouts do chat de lives';
COMMENT ON TABLE public.live_chat_settings IS 'Configurações do chat por live (slow mode, etc)';