
-- Drop função existente para recriar com novo retorno
DROP FUNCTION IF EXISTS public.get_user_chat_ban_status(UUID, UUID);

-- Recriar função de status de ban
CREATE OR REPLACE FUNCTION public.get_user_chat_ban_status(p_live_id UUID, p_user_id UUID)
RETURNS TABLE (is_banned BOOLEAN, is_timed_out BOOLEAN, timeout_until TIMESTAMPTZ, reason TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.is_ban as is_banned,
        CASE WHEN b.timeout_until IS NOT NULL AND b.timeout_until > now() THEN true ELSE false END as is_timed_out,
        b.timeout_until,
        b.reason
    FROM public.live_chat_bans b
    WHERE b.live_id = p_live_id AND b.user_id = p_user_id
    AND (b.is_ban = true OR (b.timeout_until IS NOT NULL AND b.timeout_until > now()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir índices de progresso
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);

COMMENT ON FUNCTION public.get_user_chat_ban_status IS 'Retorna status de ban/timeout do usuário no chat';
