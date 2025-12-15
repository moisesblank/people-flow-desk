-- ====================================
-- FASE 2: QUIZZES E SIMULADOS LMS
-- ====================================

-- 1. TABELA DE QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'quiz' CHECK (quiz_type IN ('quiz', 'simulado', 'avaliacao')),
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  xp_reward INTEGER DEFAULT 50,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE QUESTÕES
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  difficulty TEXT DEFAULT 'medio' CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  topic TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE TENTATIVAS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(quiz_id, user_id, started_at)
);

-- 4. TABELA DE RESPOSTAS INDIVIDUAIS
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Políticas quizzes
DROP POLICY IF EXISTS "Admin gerencia quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes publicados são públicos" ON public.quizzes;
CREATE POLICY "Admin gerencia quizzes" ON public.quizzes
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Quizzes publicados são públicos" ON public.quizzes
FOR SELECT TO authenticated
USING (is_published = true);

-- Políticas questões
DROP POLICY IF EXISTS "Admin gerencia questões" ON public.quiz_questions;
DROP POLICY IF EXISTS "Questões de quizzes publicados" ON public.quiz_questions;
CREATE POLICY "Admin gerencia questões" ON public.quiz_questions
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Questões de quizzes publicados" ON public.quiz_questions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_id AND q.is_published = true));

-- Políticas tentativas
DROP POLICY IF EXISTS "Admin vê todas tentativas" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Usuário gerencia próprias tentativas" ON public.quiz_attempts;
CREATE POLICY "Admin vê todas tentativas" ON public.quiz_attempts
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário gerencia próprias tentativas" ON public.quiz_attempts
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Políticas respostas
DROP POLICY IF EXISTS "Admin vê todas respostas" ON public.quiz_answers;
DROP POLICY IF EXISTS "Usuário gerencia próprias respostas" ON public.quiz_answers;
CREATE POLICY "Admin vê todas respostas" ON public.quiz_answers
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário gerencia próprias respostas" ON public.quiz_answers
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

-- ====================================
-- FASE 4: SEGURANÇA - TABELA MFA
-- ====================================
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method TEXT DEFAULT 'totp' CHECK (mfa_method IN ('totp', 'sms', 'email')),
  backup_codes TEXT[],
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia próprio MFA" ON public.user_mfa_settings;
CREATE POLICY "Usuário gerencia próprio MFA" ON public.user_mfa_settings
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ====================================
-- ÍNDICES DE PERFORMANCE
-- ====================================
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_module ON public.quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);