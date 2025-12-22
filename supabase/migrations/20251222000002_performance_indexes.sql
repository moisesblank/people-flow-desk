-- ============================================
-- 🔥 MIGRAÇÃO: Índices de Performance
-- Otimização para 5.000 usuários simultâneos
-- Design 2300 - Queries sub-50ms
-- ============================================

-- ============================================
-- 1. ÍNDICES PARA PROGRESSO DE ALUNOS
-- ============================================

-- Progresso por usuário
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id
    ON public.lesson_progress(user_id);

-- Progresso por aula
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
    ON public.lesson_progress(lesson_id);

-- Progresso completo (usuário + aula)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson
    ON public.lesson_progress(user_id, lesson_id);

-- ============================================
-- 2. ÍNDICES PARA MATRÍCULAS/ENROLLMENTS
-- ============================================

-- Verificar se existe a tabela antes de criar índices
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id)';
    END IF;
END $$;

-- ============================================
-- 3. ÍNDICES PARA SESSÕES DE USUÁRIO
-- ============================================

-- Sessões por usuário
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
    ON public.user_sessions(user_id);

-- Sessões ativas
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active
    ON public.user_sessions(is_active) WHERE is_active = true;

-- Sessões por token
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token
    ON public.user_sessions(session_token);

-- ============================================
-- 4. ÍNDICES PARA PROFILES
-- ============================================

-- Profiles por role
CREATE INDEX IF NOT EXISTS idx_profiles_role
    ON public.profiles(role);

-- Profiles por email
CREATE INDEX IF NOT EXISTS idx_profiles_email
    ON public.profiles(email);

-- Profiles com acesso ativo (beta)
CREATE INDEX IF NOT EXISTS idx_profiles_access_expires
    ON public.profiles(access_expires_at) 
    WHERE access_expires_at IS NOT NULL;

-- ============================================
-- 5. ÍNDICES PARA ALUNOS
-- ============================================

-- Alunos por status
CREATE INDEX IF NOT EXISTS idx_alunos_status
    ON public.alunos(status);

-- Alunos por email
CREATE INDEX IF NOT EXISTS idx_alunos_email
    ON public.alunos(email);

-- Alunos por data de criação
CREATE INDEX IF NOT EXISTS idx_alunos_created_at
    ON public.alunos(created_at DESC);

-- ============================================
-- 6. ÍNDICES PARA LOGS DE ATIVIDADE
-- ============================================

-- Logs por usuário
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
    ON public.activity_logs(user_id);

-- Logs por data
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON public.activity_logs(created_at DESC);

-- Logs por tipo de ação
CREATE INDEX IF NOT EXISTS idx_activity_logs_action
    ON public.activity_logs(action);

-- ============================================
-- 7. ÍNDICES PARA AUDIT LOGS
-- ============================================

-- Audit por tabela
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
    ON public.audit_logs(table_name);

-- Audit por data
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs(created_at DESC);

-- ============================================
-- 8. ÍNDICES PARA FLASHCARDS
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_due_date ON public.flashcards(due)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_state ON public.flashcards(state)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_user_due ON public.flashcards(user_id, due)';
    END IF;
END $$;

-- ============================================
-- 9. ÍNDICES PARA QUESTÕES
-- ============================================

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

-- ============================================
-- 10. ÍNDICES PARA CURSOS E MÓDULOS
-- ============================================

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

-- ============================================
-- 11. ÍNDICES PARA TRANSAÇÕES HOTMART
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transacoes_hotmart_completo') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_email ON public.transacoes_hotmart_completo(buyer_email)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_status ON public.transacoes_hotmart_completo(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_date ON public.transacoes_hotmart_completo(purchase_date DESC)';
    END IF;
END $$;

-- ============================================
-- 12. FUNÇÃO: Analisar performance de queries
-- ============================================
CREATE OR REPLACE FUNCTION public.analyze_slow_queries()
RETURNS TABLE (
    query_text TEXT,
    calls BIGINT,
    mean_time DOUBLE PRECISION,
    total_time DOUBLE PRECISION
) AS $$
BEGIN
    -- Esta função requer a extensão pg_stat_statements
    -- Retorna as 10 queries mais lentas
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
        -- pg_stat_statements não está habilitado
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 13. VACUUM E ANALYZE
-- ============================================
-- Nota: Executar manualmente após criar os índices
-- VACUUM ANALYZE public.live_chat_messages;
-- VACUUM ANALYZE public.user_sessions;
-- VACUUM ANALYZE public.profiles;
-- VACUUM ANALYZE public.alunos;

-- ============================================
-- 14. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION public.analyze_slow_queries IS 'Retorna as 10 queries mais lentas do sistema';
