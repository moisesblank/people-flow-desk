-- ============================================
-- OTIMIZAÇÃO DE PERFORMANCE - ÍNDICES COMPLETOS
-- ============================================

-- 1. ÍNDICES PARA LIVE CHAT
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_id
    ON public.live_chat_messages(live_id);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_user_id
    ON public.live_chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created_at
    ON public.live_chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_created
    ON public.live_chat_messages(live_id, created_at DESC);

-- 2. ÍNDICES PARA USER SESSIONS
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
    ON public.user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active
    ON public.user_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at
    ON public.user_sessions(login_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
    ON public.user_sessions(user_id, is_active);

-- 3. ÍNDICES PARA PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_email
    ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_is_online
    ON public.profiles(is_online) WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_profiles_last_activity
    ON public.profiles(last_activity_at DESC);

-- 4. ÍNDICES PARA ENTRADAS FINANCEIRAS
CREATE INDEX IF NOT EXISTS idx_entradas_data
    ON public.entradas(data DESC);

CREATE INDEX IF NOT EXISTS idx_entradas_categoria
    ON public.entradas(categoria);

CREATE INDEX IF NOT EXISTS idx_entradas_fonte
    ON public.entradas(fonte);

CREATE INDEX IF NOT EXISTS idx_entradas_data_categoria
    ON public.entradas(data DESC, categoria);

-- 5. ÍNDICES PARA ALUNOS
CREATE INDEX IF NOT EXISTS idx_alunos_status
    ON public.alunos(status);

CREATE INDEX IF NOT EXISTS idx_alunos_email
    ON public.alunos(email);

CREATE INDEX IF NOT EXISTS idx_alunos_created_at
    ON public.alunos(created_at DESC);

-- 6. ÍNDICES PARA ACTIVITY LOG (corrigido nome da tabela)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id
    ON public.activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
    ON public.activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action
    ON public.activity_log(action);

-- 7. ÍNDICES PARA AUDIT LOGS
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
    ON public.audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs(created_at DESC);

-- 8. ÍNDICES PARA FLASHCARDS (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_due_date ON public.flashcards(due)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_state ON public.flashcards(state)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_user_due ON public.flashcards(user_id, due)';
    END IF;
END $$;

-- 9. ÍNDICES PARA QUESTÕES (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON public.questions(lesson_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_attempts') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON public.question_attempts(question_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_question_attempts_user_question ON public.question_attempts(user_id, question_id)';
    END IF;
END $$;

-- 10. ÍNDICES PARA CURSOS E MÓDULOS (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_modules_position ON public.modules(course_id, position)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lessons_position ON public.lessons(module_id, position)';
    END IF;
END $$;

-- 11. ÍNDICES PARA TRANSAÇÕES HOTMART (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transacoes_hotmart_completo') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_email ON public.transacoes_hotmart_completo(buyer_email)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_status ON public.transacoes_hotmart_completo(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_date ON public.transacoes_hotmart_completo(data_compra DESC)';
    END IF;
END $$;

-- 12. FUNÇÃO: Analisar performance de queries
CREATE OR REPLACE FUNCTION public.analyze_slow_queries()
RETURNS TABLE (
    query_text TEXT,
    calls BIGINT,
    mean_time DOUBLE PRECISION,
    total_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUBSTRING(query, 1, 100) as query_text,
        pg_stat_statements.calls,
        pg_stat_statements.mean_exec_time as mean_time,
        pg_stat_statements.total_exec_time as total_time
    FROM pg_stat_statements
    ORDER BY mean_exec_time DESC
    LIMIT 10;
EXCEPTION
    WHEN undefined_table THEN
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. COMENTÁRIOS
COMMENT ON FUNCTION public.analyze_slow_queries IS 'Retorna as 10 queries mais lentas do sistema';