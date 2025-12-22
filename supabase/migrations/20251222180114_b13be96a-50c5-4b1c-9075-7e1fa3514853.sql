
-- ============================================
-- 🔥 MIGRAÇÃO: Funções de Chat v2.2 + Índices Performance
-- Versão CORRIGIDA - Sem idx_profiles_role
-- ============================================

-- DROP funções que precisam mudar assinatura
DROP FUNCTION IF EXISTS public.get_user_chat_ban_status(uuid, uuid);

-- ============================================
-- PARTE 1: FUNÇÕES ADICIONAIS DE CHAT
-- ============================================

-- 1. Obter status de ban/timeout do usuário
CREATE OR REPLACE FUNCTION public.get_user_chat_ban_status(
    p_live_id UUID,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'is_banned', COALESCE(b.is_ban, false),
        'is_timed_out', CASE WHEN b.timeout_until IS NOT NULL AND b.timeout_until > now() THEN true ELSE false END,
        'timeout_until', b.timeout_until,
        'reason', b.reason
    ) INTO v_result
    FROM public.live_chat_bans b
    WHERE b.live_id = p_live_id::text
    AND b.user_id = p_user_id
    AND (b.is_ban = true OR (b.timeout_until IS NOT NULL AND b.timeout_until > now()))
    LIMIT 1;
    
    RETURN COALESCE(v_result, jsonb_build_object(
        'is_banned', false,
        'is_timed_out', false,
        'timeout_until', null,
        'reason', null
    ));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public';

-- 2. Limpar timeouts expirados
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
    
    IF deleted_count > 0 THEN
        INSERT INTO public.audit_logs (action, table_name, metadata)
        VALUES ('TIMEOUT_CLEANUP', 'live_chat_bans', jsonb_build_object(
            'deleted_count', deleted_count,
            'executed_at', now()
        ));
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 3. Aplicar timeout temporário
CREATE OR REPLACE FUNCTION public.apply_chat_timeout(
    p_live_id UUID,
    p_user_id UUID,
    p_duration_minutes INTEGER DEFAULT 5,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_moderator_id UUID;
BEGIN
    v_moderator_id := auth.uid();
    
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_moderator_id 
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Sem permissão para aplicar timeout';
    END IF;
    
    INSERT INTO public.live_chat_bans (
        live_id, user_id, banned_by, is_ban, timeout_until, reason
    ) VALUES (
        p_live_id::text, p_user_id, v_moderator_id, false,
        now() + (p_duration_minutes || ' minutes')::INTERVAL,
        p_reason
    )
    ON CONFLICT (live_id, user_id) DO UPDATE SET
        is_ban = false,
        timeout_until = now() + (p_duration_minutes || ' minutes')::INTERVAL,
        reason = COALESCE(p_reason, live_chat_bans.reason),
        updated_at = now();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 4. Remover ban/timeout
CREATE OR REPLACE FUNCTION public.remove_chat_ban(
    p_live_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_moderator_id UUID;
BEGIN
    v_moderator_id := auth.uid();
    
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_moderator_id 
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Sem permissão para remover ban';
    END IF;
    
    DELETE FROM public.live_chat_bans
    WHERE live_id = p_live_id::text AND user_id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- ============================================
-- PARTE 2: REALTIME E COMENTÁRIOS
-- ============================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.live_chat_messages IS 'Mensagens do chat de lives - suporte a 5000+ simultâneos';
COMMENT ON TABLE public.live_chat_bans IS 'Banimentos e timeouts do chat de lives';
COMMENT ON TABLE public.live_chat_settings IS 'Configurações do chat por live (slow mode, etc)';

-- ============================================
-- PARTE 3: ÍNDICES DE PERFORMANCE GERAIS
-- ============================================

-- lesson_progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);

-- user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);

-- profiles (SEM role - role está em user_roles)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_access_expires ON public.profiles(access_expires_at) WHERE access_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online) WHERE is_online = true;

-- user_roles (tabela correta para roles)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- alunos
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_email ON public.alunos(email);
CREATE INDEX IF NOT EXISTS idx_alunos_created_at ON public.alunos(created_at DESC);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- transacoes_hotmart_completo
CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_email ON public.transacoes_hotmart_completo(buyer_email);
CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_status ON public.transacoes_hotmart_completo(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_date ON public.transacoes_hotmart_completo(data_compra DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_transaction ON public.transacoes_hotmart_completo(transaction_id);

-- affiliates
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_hotmart_id ON public.affiliates(hotmart_id);

-- comissoes
CREATE INDEX IF NOT EXISTS idx_comissoes_afiliado_id ON public.comissoes(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON public.comissoes(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_data ON public.comissoes(data DESC);

-- ============================================
-- PARTE 4: ÍNDICES CONDICIONAIS
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_modules_position ON public.modules(course_id, position)';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lessons') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lessons_position ON public.lessons(module_id, position)';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashcards') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_state ON public.flashcards(state)';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email)';
    END IF;
END $$;
