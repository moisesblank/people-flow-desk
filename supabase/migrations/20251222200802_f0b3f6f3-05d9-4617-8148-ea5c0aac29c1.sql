
-- ============================================
-- 🚀 ÍNDICES DE PERFORMANCE AVANÇADOS (v3)
-- ============================================

-- Sessões
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_access_expires ON public.profiles(access_expires_at) WHERE access_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity_at DESC);

-- User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- Alunos
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_email ON public.alunos(email);
CREATE INDEX IF NOT EXISTS idx_alunos_created_at ON public.alunos(created_at DESC);

-- Activity Log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Security Events (colunas existentes)
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_sec_events_ip ON public.security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_sec_events_resolved ON public.security_events(resolved) WHERE resolved = false;

-- Flashcards (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_flashcards_state ON public.flashcards(state)';
    END IF;
END $$;

-- Questions (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON public.questions(lesson_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_attempts' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON public.question_attempts(question_id)';
    END IF;
END $$;

-- Modules/Lessons (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id)';
    END IF;
END $$;

-- Hotmart (condicional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transacoes_hotmart_completo' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_email ON public.transacoes_hotmart_completo(buyer_email)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_status ON public.transacoes_hotmart_completo(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_hotmart_date ON public.transacoes_hotmart_completo(data_compra DESC)';
    END IF;
END $$;

-- ============================================
-- 🛡️ SECURITY AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    session_id UUID,
    action TEXT NOT NULL,
    action_category TEXT NOT NULL DEFAULT 'general',
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    severity TEXT NOT NULL DEFAULT 'info',
    request_id UUID,
    correlation_id UUID,
    metadata JSONB
);

-- Índices para security_audit_log
CREATE INDEX IF NOT EXISTS idx_sec_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_action ON public.security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_sec_audit_category ON public.security_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_sec_audit_ip ON public.security_audit_log(ip_address);

-- RLS para security_audit_log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sec_audit_select" ON public.security_audit_log;
CREATE POLICY "sec_audit_select" ON public.security_audit_log
    FOR SELECT USING (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "sec_audit_insert" ON public.security_audit_log;
CREATE POLICY "sec_audit_insert" ON public.security_audit_log
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.security_audit_log IS 'Log de auditoria imutável para segurança zero-trust';
