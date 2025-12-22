
-- ============================================
-- 🔥 MELHORIA: Sistema de Chat para Lives v2.1
-- Versão FINAL com DROP das funções existentes
-- ============================================

-- DROP funções que precisam mudar assinatura
DROP FUNCTION IF EXISTS public.check_chat_rate_limit(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.send_chat_message(uuid, text, text, text);

-- 1. ADICIONAR coluna user_role na tabela de mensagens
ALTER TABLE public.live_chat_messages 
ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'viewer';

-- 2. ADICIONAR constraint para user_role válido
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_chat_messages_user_role_check'
  ) THEN
    ALTER TABLE public.live_chat_messages 
    ADD CONSTRAINT live_chat_messages_user_role_check 
    CHECK (user_role IN ('owner', 'admin', 'moderator', 'beta', 'viewer'));
  END IF;
END $$;

-- 3. ADICIONAR constraint para limite de 500 caracteres
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_chat_messages_content_length_check'
  ) THEN
    ALTER TABLE public.live_chat_messages 
    ADD CONSTRAINT live_chat_messages_content_length_check 
    CHECK (char_length(message) <= 500);
  END IF;
END $$;

-- 4. ADICIONAR colunas em live_chat_settings
ALTER TABLE public.live_chat_settings 
ADD COLUMN IF NOT EXISTS min_account_age_days INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.live_chat_settings 
ADD COLUMN IF NOT EXISTS blocked_words TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 5. ÍNDICES ADICIONAIS para performance 5K+
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_not_deleted 
    ON public.live_chat_messages(live_id, created_at DESC) 
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_role 
    ON public.live_chat_messages(live_id, user_role);

CREATE INDEX IF NOT EXISTS idx_live_chat_bans_permanent_v2 
    ON public.live_chat_bans(live_id, user_id) 
    WHERE is_ban = true;

CREATE INDEX IF NOT EXISTS idx_live_chat_bans_timeout_check 
    ON public.live_chat_bans(live_id, user_id, timeout_until);

-- 6. FUNÇÃO: Verificar ban melhorada
CREATE OR REPLACE FUNCTION public.is_user_banned_from_chat(
    p_live_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.live_chat_bans
        WHERE live_id = p_live_id::text
        AND user_id = p_user_id
        AND (is_ban = true OR (timeout_until IS NOT NULL AND timeout_until > now()))
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public';

-- 7. FUNÇÃO: Rate limit v2 (retorna JSONB para compatibilidade)
CREATE OR REPLACE FUNCTION public.check_chat_rate_limit_v2(
    p_live_id UUID,
    p_user_id UUID,
    p_window_ms INTEGER DEFAULT 5000
) RETURNS JSONB AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_message_count INTEGER;
    v_last_message_at TIMESTAMPTZ;
    v_interval INTERVAL;
BEGIN
    v_interval := (p_window_ms || ' milliseconds')::INTERVAL;
    v_window_start := now() - v_interval;
    
    SELECT COUNT(*), MAX(created_at)
    INTO v_message_count, v_last_message_at
    FROM public.live_chat_messages
    WHERE live_id = p_live_id
      AND user_id = p_user_id
      AND created_at > v_window_start
      AND is_deleted = false;
    
    RETURN jsonb_build_object(
        'allowed', v_message_count < 1,
        'messages_in_window', v_message_count,
        'next_allowed_at', CASE 
            WHEN v_last_message_at IS NOT NULL THEN v_last_message_at + v_interval
            ELSE now()
        END
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public';

-- 8. FUNÇÃO: Limpar mensagens antigas
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
    
    INSERT INTO public.audit_logs (action, table_name, metadata)
    VALUES ('CHAT_CLEANUP', 'live_chat_messages', jsonb_build_object(
        'deleted_count', deleted_count,
        'executed_at', now()
    ));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 9. FUNÇÃO: Estatísticas do chat
CREATE OR REPLACE FUNCTION public.get_live_chat_stats(p_live_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'total_messages', (SELECT COUNT(*) FROM public.live_chat_messages WHERE live_id = p_live_id AND is_deleted = false),
        'unique_users', (SELECT COUNT(DISTINCT user_id) FROM public.live_chat_messages WHERE live_id = p_live_id AND is_deleted = false),
        'messages_last_minute', (SELECT COUNT(*) FROM public.live_chat_messages WHERE live_id = p_live_id AND is_deleted = false AND created_at > now() - INTERVAL '1 minute'),
        'pinned_messages', (SELECT COUNT(*) FROM public.live_chat_messages WHERE live_id = p_live_id AND is_pinned = true),
        'banned_users', (SELECT COUNT(*) FROM public.live_chat_bans WHERE live_id = p_live_id::text AND (is_ban = true OR timeout_until > now()))
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public';

-- 10. FUNÇÃO: Enviar mensagem com validações
CREATE OR REPLACE FUNCTION public.send_chat_message_v2(
    p_live_id UUID,
    p_message TEXT,
    p_user_name TEXT DEFAULT NULL,
    p_user_avatar TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_message_id UUID;
    v_is_banned BOOLEAN;
    v_settings RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    v_is_banned := public.is_user_banned_from_chat(p_live_id, v_user_id);
    IF v_is_banned THEN
        RAISE EXCEPTION 'Usuário banido do chat';
    END IF;
    
    SELECT * INTO v_settings FROM public.live_chat_settings WHERE live_id = p_live_id::text;
    
    IF v_settings IS NOT NULL AND NOT v_settings.chat_enabled THEN
        RAISE EXCEPTION 'Chat desabilitado';
    END IF;
    
    IF char_length(p_message) > 500 THEN
        RAISE EXCEPTION 'Mensagem muito longa (máximo 500 caracteres)';
    END IF;
    
    SELECT COALESCE(
        (SELECT role::text FROM public.user_roles WHERE user_id = v_user_id LIMIT 1),
        'viewer'
    ) INTO v_user_role;
    
    INSERT INTO public.live_chat_messages (
        live_id, user_id, user_name, avatar_url, message, user_role
    ) VALUES (
        p_live_id, v_user_id, COALESCE(p_user_name, 'Anônimo'), p_user_avatar, p_message, v_user_role
    )
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 11. Habilitar Realtime
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_bans;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
