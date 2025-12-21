-- ============================================
-- PARTE 10.4-10.6: GENOMA DIVINO - Tabelas de Conteúdo
-- Complementos e melhorias
-- ============================================

-- 10.4.1 Criar tabela de áreas hierárquicas (se não existir)
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  parent_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#7D1128',
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10.4.2 Adicionar coluna transcript e area_id à lessons (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'lessons' AND column_name = 'transcript') THEN
    ALTER TABLE public.lessons ADD COLUMN transcript TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'lessons' AND column_name = 'area_id') THEN
    ALTER TABLE public.lessons ADD COLUMN area_id UUID REFERENCES public.areas(id);
  END IF;
END $$;

-- 10.4.3 Criar tabela lesson_attempts (se não existir)
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  watch_time_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 10.5.1 Criar tabela de questões (se não existir)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id),
  lesson_id UUID REFERENCES public.lessons(id),
  quiz_id UUID REFERENCES public.quizzes(id),
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty question_difficulty DEFAULT 'medium',
  banca TEXT,
  ano INTEGER,
  tags TEXT[],
  points INTEGER DEFAULT 10,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10.5.2 Melhorar question_attempts com mais campos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'question_attempts' AND column_name = 'xp_earned') THEN
    ALTER TABLE public.question_attempts ADD COLUMN xp_earned INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'question_attempts' AND column_name = 'attempt_number') THEN
    ALTER TABLE public.question_attempts ADD COLUMN attempt_number INTEGER DEFAULT 1;
  END IF;
END $$;

-- 10.6.1 Adicionar campos extras ao study_flashcards
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'study_flashcards' AND column_name = 'lesson_id') THEN
    ALTER TABLE public.study_flashcards ADD COLUMN lesson_id UUID REFERENCES public.lessons(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'study_flashcards' AND column_name = 'source') THEN
    ALTER TABLE public.study_flashcards ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'study_flashcards' AND column_name = 'tags') THEN
    ALTER TABLE public.study_flashcards ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_areas_parent ON public.areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_areas_course ON public.areas(course_id);
CREATE INDEX IF NOT EXISTS idx_areas_position ON public.areas(position);

CREATE INDEX IF NOT EXISTS idx_lessons_area ON public.lessons(area_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_position ON public.lessons(module_id, position);

CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user ON public.lesson_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson ON public.lesson_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_completed ON public.lesson_attempts(user_id, completed) WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_questions_area ON public.questions(area_id);
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON public.questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_banca ON public.questions(banca) WHERE banca IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_study_flashcards_due ON public.study_flashcards(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_study_flashcards_state ON public.study_flashcards(user_id, state);
CREATE INDEX IF NOT EXISTS idx_study_flashcards_lesson ON public.study_flashcards(lesson_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Áreas
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_public_read" ON public.areas;
CREATE POLICY "areas_public_read" ON public.areas FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "areas_admin_manage" ON public.areas;
CREATE POLICY "areas_admin_manage" ON public.areas FOR ALL USING (is_admin_or_owner(auth.uid()));

-- Lesson Attempts
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_attempts_own" ON public.lesson_attempts;
CREATE POLICY "lesson_attempts_own" ON public.lesson_attempts FOR ALL 
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid());

-- Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_read" ON public.questions;
CREATE POLICY "questions_read" ON public.questions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "questions_admin_manage" ON public.questions;
CREATE POLICY "questions_admin_manage" ON public.questions FOR ALL USING (is_admin_or_owner(auth.uid()));

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_areas_updated_at ON public.areas;
CREATE TRIGGER tr_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION update_areas_updated_at();

DROP TRIGGER IF EXISTS tr_lesson_attempts_updated_at ON public.lesson_attempts;
CREATE TRIGGER tr_lesson_attempts_updated_at
  BEFORE UPDATE ON public.lesson_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS tr_questions_updated_at ON public.questions;
CREATE TRIGGER tr_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.areas IS 'Áreas de estudo hierárquicas para organização do conteúdo';
COMMENT ON TABLE public.lesson_attempts IS 'Registro de progresso dos alunos nas aulas';
COMMENT ON TABLE public.questions IS 'Banco de questões com suporte a múltiplos tipos e dificuldades';
COMMENT ON TABLE public.study_flashcards IS 'Sistema de flashcards com algoritmo FSRS para repetição espaçada';