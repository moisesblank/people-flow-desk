-- ============================================
-- 🔥 DOGMA SUPREMO: EXCLUIR = ANIQUILAR
-- Garantir CASCADE DELETE em TODAS tabelas de usuário
-- ============================================

-- 1. Profiles: Garantir CASCADE de auth.users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    -- Se a FK não existe, criar
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Active Sessions: Garantir CASCADE
ALTER TABLE public.active_sessions 
DROP CONSTRAINT IF EXISTS active_sessions_user_id_fkey;

ALTER TABLE public.active_sessions 
ADD CONSTRAINT active_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. User Devices: Garantir CASCADE
ALTER TABLE public.user_devices 
DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;

ALTER TABLE public.user_devices 
ADD CONSTRAINT user_devices_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Device Trust Scores: Garantir CASCADE (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_trust_scores') THEN
    ALTER TABLE public.device_trust_scores 
    DROP CONSTRAINT IF EXISTS device_trust_scores_user_id_fkey;
    
    ALTER TABLE public.device_trust_scores 
    ADD CONSTRAINT device_trust_scores_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Trusted Devices: Garantir CASCADE (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trusted_devices') THEN
    ALTER TABLE public.trusted_devices 
    DROP CONSTRAINT IF EXISTS trusted_devices_user_id_fkey;
    
    ALTER TABLE public.trusted_devices 
    ADD CONSTRAINT trusted_devices_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. User Sessions: Garantir CASCADE (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    ALTER TABLE public.user_sessions 
    DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
    
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 7. Alunos: Atualizar para SET NULL (preservar histórico financeiro)
-- NOTA: alunos NÃO é deletado por CASCADE do auth.users
-- Mas se o aluno for excluído diretamente, entradas/comissões ficam com aluno_id = NULL

-- 8. Employees: Garantir CASCADE do user_id (funcionário some quando auth some)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.employees 
    DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
    
    ALTER TABLE public.employees 
    ADD CONSTRAINT employees_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 9. Funcionarios: Garantir CASCADE do user_id (se existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcionarios' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.funcionarios 
    DROP CONSTRAINT IF EXISTS funcionarios_user_id_fkey;
    
    ALTER TABLE public.funcionarios 
    ADD CONSTRAINT funcionarios_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 10. Book Access Logs: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_access_logs') THEN
    ALTER TABLE public.book_access_logs 
    DROP CONSTRAINT IF EXISTS book_access_logs_user_id_fkey;
    
    ALTER TABLE public.book_access_logs 
    ADD CONSTRAINT book_access_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 11. Book Chat Messages: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_chat_messages') THEN
    ALTER TABLE public.book_chat_messages 
    DROP CONSTRAINT IF EXISTS book_chat_messages_user_id_fkey;
    
    ALTER TABLE public.book_chat_messages 
    ADD CONSTRAINT book_chat_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 12. Book Chat Threads: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_chat_threads') THEN
    ALTER TABLE public.book_chat_threads 
    DROP CONSTRAINT IF EXISTS book_chat_threads_user_id_fkey;
    
    ALTER TABLE public.book_chat_threads 
    ADD CONSTRAINT book_chat_threads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 13. Book Reading Sessions: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_reading_sessions') THEN
    ALTER TABLE public.book_reading_sessions 
    DROP CONSTRAINT IF EXISTS book_reading_sessions_user_id_fkey;
    
    ALTER TABLE public.book_reading_sessions 
    ADD CONSTRAINT book_reading_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 14. Calendar Tasks: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_tasks') THEN
    ALTER TABLE public.calendar_tasks 
    DROP CONSTRAINT IF EXISTS calendar_tasks_user_id_fkey;
    
    ALTER TABLE public.calendar_tasks 
    ADD CONSTRAINT calendar_tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 15. Certificates: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    ALTER TABLE public.certificates 
    DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
    
    ALTER TABLE public.certificates 
    ADD CONSTRAINT certificates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 16. Lesson Progress: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_progress') THEN
    ALTER TABLE public.lesson_progress 
    DROP CONSTRAINT IF EXISTS lesson_progress_user_id_fkey;
    
    ALTER TABLE public.lesson_progress 
    ADD CONSTRAINT lesson_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 17. Course Progress: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_progress') THEN
    ALTER TABLE public.course_progress 
    DROP CONSTRAINT IF EXISTS course_progress_user_id_fkey;
    
    ALTER TABLE public.course_progress 
    ADD CONSTRAINT course_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 18. Enrollment: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollment') THEN
    ALTER TABLE public.enrollment 
    DROP CONSTRAINT IF EXISTS enrollment_user_id_fkey;
    
    ALTER TABLE public.enrollment 
    ADD CONSTRAINT enrollment_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 19. User Achievements: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
    ALTER TABLE public.user_achievements 
    DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
    
    ALTER TABLE public.user_achievements 
    ADD CONSTRAINT user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 20. User Badges: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    ALTER TABLE public.user_badges 
    DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
    
    ALTER TABLE public.user_badges 
    ADD CONSTRAINT user_badges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 21. Notifications: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE public.notifications 
    DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 22. Flashcards progress: Garantir CASCADE
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcard_progress') THEN
    ALTER TABLE public.flashcard_progress 
    DROP CONSTRAINT IF EXISTS flashcard_progress_user_id_fkey;
    
    ALTER TABLE public.flashcard_progress 
    ADD CONSTRAINT flashcard_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- COMENTÁRIO FINAL
-- ============================================
COMMENT ON CONSTRAINT active_sessions_user_id_fkey ON public.active_sessions IS 
  'DOGMA SUPREMO: Excluir auth.user = Excluir TUDO relacionado';