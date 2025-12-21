-- ============================================
-- SYNAPSE v14.0 - TRIGGER DE ATIVIDADE DO USUÁRIO
-- Atualiza last_activity_at automaticamente
-- ============================================

-- Garantir que profiles tem o campo last_activity_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_activity_at TIMESTAMPTZ;
  END IF;
END $$;

-- Função para atualizar last_activity_at (usa NEW.user_id do registro)
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    last_activity_at = NOW(), 
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION public.update_last_activity IS 'Atualiza last_activity_at do usuário quando há atividade em tabelas monitoradas';

-- Trigger em lesson_attempts (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lesson_attempts') THEN
    DROP TRIGGER IF EXISTS on_lesson_attempt_activity ON public.lesson_attempts;
    CREATE TRIGGER on_lesson_attempt_activity
      AFTER INSERT ON public.lesson_attempts
      FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();
  END IF;
END $$;

-- Trigger em question_attempts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'question_attempts') THEN
    DROP TRIGGER IF EXISTS on_question_attempt_activity ON public.question_attempts;
    CREATE TRIGGER on_question_attempt_activity
      AFTER INSERT ON public.question_attempts
      FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();
  END IF;
END $$;

-- Trigger em study_flashcards (nosso sistema de flashcards)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'study_flashcards') THEN
    DROP TRIGGER IF EXISTS on_flashcard_activity ON public.study_flashcards;
    CREATE TRIGGER on_flashcard_activity
      AFTER UPDATE ON public.study_flashcards
      FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();
  END IF;
END $$;

-- Trigger em lesson_progress (progresso de aulas)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lesson_progress') THEN
    DROP TRIGGER IF EXISTS on_lesson_progress_activity ON public.lesson_progress;
    CREATE TRIGGER on_lesson_progress_activity
      AFTER INSERT OR UPDATE ON public.lesson_progress
      FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();
  END IF;
END $$;

-- Trigger em xp_history (quando ganha XP)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'xp_history') THEN
    DROP TRIGGER IF EXISTS on_xp_gain_activity ON public.xp_history;
    CREATE TRIGGER on_xp_gain_activity
      AFTER INSERT ON public.xp_history
      FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();
  END IF;
END $$;

-- Trigger em user_sessions (quando há login)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    DROP TRIGGER IF EXISTS on_session_activity ON public.user_sessions;
    CREATE TRIGGER on_session_activity
      AFTER INSERT OR UPDATE ON public.user_sessions
      FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();
  END IF;
END $$;

-- Índice para consultas de atividade (ordenação por última atividade)
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity_at DESC NULLS LAST);