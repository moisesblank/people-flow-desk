-- ============================================
-- 🛡️ MIGRAÇÃO: RLS HARDENING v1.0
-- Políticas de segurança Zero-Trust
-- Baseado na Matriz M4 - C010/C011/C012
-- ============================================

-- ============================================
-- FUNÇÃO HELPER: get_user_role
-- Cache do role do usuário para performance
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid());
    
    RETURN COALESCE(v_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FUNÇÃO: can_access_resource
-- Verificação genérica de acesso a recurso
-- ============================================
CREATE OR REPLACE FUNCTION public.can_access_resource(
    p_resource_type TEXT,
    p_resource_id UUID,
    p_action TEXT DEFAULT 'read'
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_role TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    
    -- Owner pode tudo
    IF v_role = 'owner' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin pode quase tudo
    IF v_role = 'admin' AND p_action IN ('read', 'write') THEN
        RETURN TRUE;
    END IF;
    
    -- Verificações específicas por tipo de recurso
    CASE p_resource_type
        WHEN 'course' THEN
            -- Verificar matrícula ativa
            RETURN EXISTS (
                SELECT 1 FROM public.enrollments
                WHERE user_id = v_user_id
                AND course_id = p_resource_id
                AND status = 'active'
            );
        WHEN 'lesson' THEN
            -- Verificar se tem acesso ao curso da aula
            RETURN EXISTS (
                SELECT 1 FROM public.lessons l
                JOIN public.modules m ON l.module_id = m.id
                JOIN public.enrollments e ON e.course_id = m.course_id
                WHERE l.id = p_resource_id
                AND e.user_id = v_user_id
                AND e.status = 'active'
            );
        WHEN 'live' THEN
            -- Verificar acesso beta ou owner
            RETURN v_role IN ('beta', 'owner', 'admin');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HARDENING: profiles
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas seu próprio perfil
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR public.is_admin()
    );

-- Usuário atualiza apenas seu próprio perfil (exceto role)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Não pode mudar o próprio role (apenas admin pode)
        AND (
            public.is_owner()
            OR OLD.role = NEW.role
        )
    );

-- Admin pode ver e gerenciar todos os perfis
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL USING (public.is_owner());

-- ============================================
-- HARDENING: alunos
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'alunos') THEN
        ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
        
        -- Usuário vê apenas seu próprio registro
        DROP POLICY IF EXISTS "alunos_read_own" ON public.alunos;
        EXECUTE 'CREATE POLICY "alunos_read_own" ON public.alunos
            FOR SELECT USING (
                auth.uid() = user_id
                OR public.is_admin()
            )';
        
        -- Apenas admin pode modificar
        DROP POLICY IF EXISTS "alunos_admin_modify" ON public.alunos;
        EXECUTE 'CREATE POLICY "alunos_admin_modify" ON public.alunos
            FOR ALL USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- HARDENING: enrollments (matrículas)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enrollments') THEN
        ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
        
        -- Usuário vê apenas suas matrículas
        DROP POLICY IF EXISTS "enrollments_read_own" ON public.enrollments;
        EXECUTE 'CREATE POLICY "enrollments_read_own" ON public.enrollments
            FOR SELECT USING (
                auth.uid() = user_id
                OR public.is_admin()
            )';
        
        -- Apenas sistema/admin pode criar/modificar matrículas
        DROP POLICY IF EXISTS "enrollments_admin_modify" ON public.enrollments;
        EXECUTE 'CREATE POLICY "enrollments_admin_modify" ON public.enrollments
            FOR ALL USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- HARDENING: payments/transactions
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payments') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "payments_read_own" ON public.payments;
        EXECUTE 'CREATE POLICY "payments_read_own" ON public.payments
            FOR SELECT USING (
                auth.uid() = user_id
                OR public.is_admin()
            )';
        
        DROP POLICY IF EXISTS "payments_admin_modify" ON public.payments;
        EXECUTE 'CREATE POLICY "payments_admin_modify" ON public.payments
            FOR ALL USING (public.is_owner())';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transacoes_hotmart_completo') THEN
        ALTER TABLE public.transacoes_hotmart_completo ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "transacoes_admin_only" ON public.transacoes_hotmart_completo;
        EXECUTE 'CREATE POLICY "transacoes_admin_only" ON public.transacoes_hotmart_completo
            FOR ALL USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- HARDENING: user_sessions (sessão única)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') THEN
        ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Usuário vê/modifica apenas suas sessões
        DROP POLICY IF EXISTS "sessions_own" ON public.user_sessions;
        EXECUTE 'CREATE POLICY "sessions_own" ON public.user_sessions
            FOR ALL USING (auth.uid() = user_id)';
        
        -- Admin pode ver todas
        DROP POLICY IF EXISTS "sessions_admin_read" ON public.user_sessions;
        EXECUTE 'CREATE POLICY "sessions_admin_read" ON public.user_sessions
            FOR SELECT USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- HARDENING: user_devices
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_devices') THEN
        ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "devices_own" ON public.user_devices;
        EXECUTE 'CREATE POLICY "devices_own" ON public.user_devices
            FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

-- ============================================
-- HARDENING: lesson_progress
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lesson_progress') THEN
        ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "progress_own" ON public.lesson_progress;
        EXECUTE 'CREATE POLICY "progress_own" ON public.lesson_progress
            FOR ALL USING (auth.uid() = user_id)';
        
        DROP POLICY IF EXISTS "progress_admin_read" ON public.lesson_progress;
        EXECUTE 'CREATE POLICY "progress_admin_read" ON public.lesson_progress
            FOR SELECT USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- HARDENING: flashcards / quiz_attempts
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'flashcards') THEN
        ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "flashcards_own" ON public.flashcards;
        EXECUTE 'CREATE POLICY "flashcards_own" ON public.flashcards
            FOR ALL USING (auth.uid() = user_id)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quiz_attempts') THEN
        ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "quiz_attempts_own" ON public.quiz_attempts;
        EXECUTE 'CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts
            FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

-- ============================================
-- HARDENING: courses / modules / lessons
-- Conteúdo pode ser lido por matriculados
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'courses') THEN
        ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
        
        -- Cursos públicos ou com matrícula
        DROP POLICY IF EXISTS "courses_read" ON public.courses;
        EXECUTE 'CREATE POLICY "courses_read" ON public.courses
            FOR SELECT USING (
                is_published = true
                OR public.is_admin()
                OR EXISTS (
                    SELECT 1 FROM public.enrollments
                    WHERE user_id = auth.uid()
                    AND course_id = courses.id
                    AND status = ''active''
                )
            )';
        
        DROP POLICY IF EXISTS "courses_admin_modify" ON public.courses;
        EXECUTE 'CREATE POLICY "courses_admin_modify" ON public.courses
            FOR ALL USING (public.is_admin())';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'modules') THEN
        ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "modules_read" ON public.modules;
        EXECUTE 'CREATE POLICY "modules_read" ON public.modules
            FOR SELECT USING (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 FROM public.enrollments e
                    WHERE e.user_id = auth.uid()
                    AND e.course_id = modules.course_id
                    AND e.status = ''active''
                )
            )';
        
        DROP POLICY IF EXISTS "modules_admin_modify" ON public.modules;
        EXECUTE 'CREATE POLICY "modules_admin_modify" ON public.modules
            FOR ALL USING (public.is_admin())';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lessons') THEN
        ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "lessons_read" ON public.lessons;
        EXECUTE 'CREATE POLICY "lessons_read" ON public.lessons
            FOR SELECT USING (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 FROM public.modules m
                    JOIN public.enrollments e ON e.course_id = m.course_id
                    WHERE m.id = lessons.module_id
                    AND e.user_id = auth.uid()
                    AND e.status = ''active''
                )
            )';
        
        DROP POLICY IF EXISTS "lessons_admin_modify" ON public.lessons;
        EXECUTE 'CREATE POLICY "lessons_admin_modify" ON public.lessons
            FOR ALL USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- HARDENING: user_mfa_settings
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_mfa_settings') THEN
        ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
        
        -- Usuário gerencia apenas seu próprio MFA
        DROP POLICY IF EXISTS "mfa_own" ON public.user_mfa_settings;
        EXECUTE 'CREATE POLICY "mfa_own" ON public.user_mfa_settings
            FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

-- ============================================
-- HARDENING: live_events
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'live_events') THEN
        ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
        
        -- Usuários beta/owner podem ver lives
        DROP POLICY IF EXISTS "lives_read" ON public.live_events;
        EXECUTE 'CREATE POLICY "lives_read" ON public.live_events
            FOR SELECT USING (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND role IN (''owner'', ''beta'', ''admin'')
                )
            )';
        
        DROP POLICY IF EXISTS "lives_admin_modify" ON public.live_events;
        EXECUTE 'CREATE POLICY "lives_admin_modify" ON public.live_events
            FOR ALL USING (public.is_admin())';
    END IF;
END $$;

-- ============================================
-- VIEW: RLS Status Report (para auditoria)
-- ============================================
CREATE OR REPLACE VIEW public.rls_status_report AS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END as status,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = t.schemaname AND tablename = t.tablename
    ) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_prisma_%'
ORDER BY rowsecurity, tablename;

COMMENT ON VIEW public.rls_status_report IS 'Relatório de status RLS para auditoria de segurança';

-- ============================================
-- FUNÇÃO: audit_rls_coverage
-- Gerar relatório de cobertura RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_rls_coverage()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT,
    has_select_policy BOOLEAN,
    has_insert_policy BOOLEAN,
    has_update_policy BOOLEAN,
    has_delete_policy BOOLEAN,
    risk_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::BIGINT,
        COALESCE(p.has_select, false),
        COALESCE(p.has_insert, false),
        COALESCE(p.has_update, false),
        COALESCE(p.has_delete, false),
        CASE 
            WHEN NOT t.rowsecurity THEN 'CRITICAL'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH'
            WHEN NOT COALESCE(p.has_select, false) THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN (
        SELECT 
            tablename,
            COUNT(*) as policy_count,
            BOOL_OR(cmd = 'SELECT' OR cmd = '*') as has_select,
            BOOL_OR(cmd = 'INSERT' OR cmd = '*') as has_insert,
            BOOL_OR(cmd = 'UPDATE' OR cmd = '*') as has_update,
            BOOL_OR(cmd = 'DELETE' OR cmd = '*') as has_delete
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE '_prisma_%'
    AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    ORDER BY 
        CASE 
            WHEN NOT t.rowsecurity THEN 1
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 2
            ELSE 3
        END,
        t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_rls_coverage IS 'Auditar cobertura de RLS em todas as tabelas';
