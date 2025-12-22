-- ============================================
-- 🔥 CORREÇÕES SQL PARA SUPORTE A 5.000 AO VIVO
-- Executar via Supabase SQL Editor
-- Data: 22/12/2024
-- ============================================

-- ============================================
-- PARTE 1: ÍNDICES PARA PERFORMANCE
-- ============================================

-- Progresso do aluno (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course 
  ON lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson 
  ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed 
  ON lesson_progress(user_id, completed_at) 
  WHERE completed_at IS NOT NULL;

-- Matrículas (verificação de acesso)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status 
  ON enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status 
  ON enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_active 
  ON enrollments(user_id, course_id) 
  WHERE status = 'active';

-- Chat (paginação e filtros)
CREATE INDEX IF NOT EXISTS idx_youtube_live_chat_created 
  ON youtube_live_chat(live_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_live_chat_author 
  ON youtube_live_chat(author_channel_id);

-- Lives (busca por status)
CREATE INDEX IF NOT EXISTS idx_youtube_lives_status_scheduled 
  ON youtube_lives(status, scheduled_start DESC);

-- Attendance (relatórios)
CREATE INDEX IF NOT EXISTS idx_youtube_live_attendance_aluno 
  ON youtube_live_attendance(aluno_id, joined_at DESC);

-- Perfis (busca frequente)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);

-- ============================================
-- PARTE 2: ÍNDICES DE SESSÃO ÚNICA
-- ============================================

-- Sessões de usuário
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
  ON user_sessions(session_token) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
  ON user_sessions(user_id, is_active) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
  ON user_sessions(expires_at) 
  WHERE is_active = true;

-- Dispositivos
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint_active 
  ON user_devices(device_fingerprint) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active 
  ON user_devices(user_id, is_active) 
  WHERE is_active = true;

-- ============================================
-- PARTE 3: CORREÇÕES RLS - CHAT
-- ============================================

-- Remover políticas permissivas existentes
DROP POLICY IF EXISTS "Service pode gerenciar chat" ON youtube_live_chat;
DROP POLICY IF EXISTS "YouTube chat é público" ON youtube_live_chat;

-- Leitura: todos podem ver (chat é público)
CREATE POLICY "chat_select_public" 
  ON youtube_live_chat FOR SELECT 
  USING (true);

-- Inserção: apenas usuários autenticados
CREATE POLICY "chat_insert_authenticated" 
  ON youtube_live_chat FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Atualização: apenas admins/moderadores
CREATE POLICY "chat_update_moderators" 
  ON youtube_live_chat FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator', 'owner')
    )
  );

-- Deleção: apenas admins/moderadores (para moderação)
CREATE POLICY "chat_delete_moderators" 
  ON youtube_live_chat FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator', 'owner')
    )
  );

-- ============================================
-- PARTE 4: CORREÇÕES RLS - ATTENDANCE
-- ============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Service pode gerenciar attendance" ON youtube_live_attendance;
DROP POLICY IF EXISTS "Presença é pública" ON youtube_live_attendance;

-- Leitura: usuário vê própria presença, admins veem tudo
CREATE POLICY "attendance_select_own_or_admin" 
  ON youtube_live_attendance FOR SELECT 
  USING (
    aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Inserção: sistema ou próprio usuário
CREATE POLICY "attendance_insert" 
  ON youtube_live_attendance FOR INSERT 
  WITH CHECK (
    aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
    OR auth.uid() IS NOT NULL
  );

-- Atualização: apenas sistema (via service role)
-- Controlado pelo backend

-- ============================================
-- PARTE 5: OTIMIZAÇÃO DE QUERIES
-- ============================================

-- Função para buscar lives ativas (otimizada)
CREATE OR REPLACE FUNCTION get_active_lives()
RETURNS TABLE (
  id UUID,
  video_id TEXT,
  titulo TEXT,
  status TEXT,
  max_viewers INTEGER,
  scheduled_start TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id, video_id, titulo, status, max_viewers, scheduled_start
  FROM youtube_lives
  WHERE status = 'live'
  ORDER BY actual_start DESC
  LIMIT 1;
$$;

-- Função para buscar próximas lives (otimizada)
CREATE OR REPLACE FUNCTION get_upcoming_lives(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  video_id TEXT,
  titulo TEXT,
  scheduled_start TIMESTAMPTZ,
  thumbnail_url TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id, video_id, titulo, scheduled_start, thumbnail_url
  FROM youtube_lives
  WHERE status = 'upcoming' 
    AND scheduled_start > NOW()
  ORDER BY scheduled_start ASC
  LIMIT p_limit;
$$;

-- Função para contagem de viewers (cache-friendly)
CREATE OR REPLACE FUNCTION get_live_viewer_count(p_live_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(max_viewers, 0)
  FROM youtube_lives
  WHERE id = p_live_id;
$$;

-- ============================================
-- PARTE 6: TABELA DE RATE LIMITING (BACKEND)
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint 
  ON rate_limit_log(user_id, endpoint, window_start);

-- Limpar logs antigos (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM rate_limit_log 
  WHERE window_start < NOW() - INTERVAL '1 hour';
$$;

-- ============================================
-- PARTE 7: TABELA DE BAN/TIMEOUT (MODERAÇÃO)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  live_id UUID REFERENCES youtube_lives(id),
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  ban_type TEXT DEFAULT 'timeout', -- 'timeout', 'permanent'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_bans_user_live 
  ON chat_bans(user_id, live_id) 
  WHERE expires_at > NOW() OR ban_type = 'permanent';

-- Função para verificar se usuário está banido
CREATE OR REPLACE FUNCTION is_user_banned(p_user_id UUID, p_live_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_bans
    WHERE user_id = p_user_id
      AND (live_id = p_live_id OR live_id IS NULL) -- ban global ou específico
      AND (expires_at > NOW() OR ban_type = 'permanent')
  );
$$;

-- ============================================
-- PARTE 8: VACUUM E ANALYZE
-- ============================================

-- Executar após criar índices (melhora performance)
ANALYZE youtube_lives;
ANALYZE youtube_live_chat;
ANALYZE youtube_live_attendance;
ANALYZE profiles;
ANALYZE enrollments;
ANALYZE lesson_progress;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Listar todos os índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('youtube_live_chat', 'youtube_live_attendance', 'youtube_lives')
ORDER BY tablename, policyname;
