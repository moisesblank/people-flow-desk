-- ============================================
-- 🔥 ÍNDICES CRÍTICOS PARA 5K SIMULTÂNEOS
-- Performance Máxima - Matriz 2300
-- ============================================

-- Índices para Chat de Lives (CRÍTICO para 5K)
CREATE INDEX IF NOT EXISTS idx_live_chat_live_id ON public.live_chat_messages(live_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_created_at ON public.live_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_user_id ON public.live_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_composite ON public.live_chat_messages(live_id, created_at DESC);

-- Índices para Progresso de Alunos
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_composite ON public.lesson_progress(user_id, lesson_id);

-- Índices para Matrículas/Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_composite ON public.enrollments(user_id, course_id, status);

-- Índices para Sessões de Usuário
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;

-- Índices para Profiles (busca frequente)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Índices para Aulas/Lessons (usando colunas existentes)
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position ON public.lessons(position);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);

-- Índices para Módulos
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_position ON public.modules(position);
CREATE INDEX IF NOT EXISTS idx_modules_published ON public.modules(is_published) WHERE is_published = true;

-- Índices para Cursos
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- Índices para Atividade/Analytics (otimização de queries)
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_metrics(metric_type);

-- Índices para Dispositivos
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON public.user_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);

-- Índices para Notificações (usando coluna 'read' existente)
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Estatísticas atualizadas para o query planner
ANALYZE public.live_chat_messages;
ANALYZE public.lesson_progress;
ANALYZE public.enrollments;
ANALYZE public.user_sessions;
ANALYZE public.profiles;
ANALYZE public.lessons;
ANALYZE public.modules;
ANALYZE public.courses;