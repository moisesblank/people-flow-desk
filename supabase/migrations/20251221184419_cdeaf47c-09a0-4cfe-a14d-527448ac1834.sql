
-- =====================================================================
-- 🛕 SANTUÁRIO BETA v9.0 - PARTE 2: TABELAS DO SANTUÁRIO
-- =====================================================================

-- Tabela de Áreas de Estudo (Hierárquica)
CREATE TABLE IF NOT EXISTS public.study_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID REFERENCES public.study_areas(id),
    course_id UUID REFERENCES public.courses(id),
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_areas_parent_id ON public.study_areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_study_areas_course_id ON public.study_areas(course_id);

-- Tabela de Questões do Santuário
CREATE TABLE IF NOT EXISTS public.sanctuary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID REFERENCES public.study_areas(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    banca TEXT,
    year INT,
    difficulty TEXT DEFAULT 'medium',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sanctuary_questions_area_id ON public.sanctuary_questions(area_id);
CREATE INDEX IF NOT EXISTS idx_sanctuary_questions_banca ON public.sanctuary_questions(banca);

-- Tabela de Tentativas de Questões
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.sanctuary_questions(id) ON DELETE CASCADE NOT NULL,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON public.question_attempts(question_id);

-- Caderno de Erros Automatizado
CREATE TABLE IF NOT EXISTS public.error_notebook (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.sanctuary_questions(id) ON DELETE CASCADE NOT NULL,
    error_count INT DEFAULT 1,
    last_error_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    mastered BOOLEAN DEFAULT FALSE,
    mastered_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, question_id)
);

-- Flashcards com FSRS (Repetição Espaçada)
CREATE TABLE IF NOT EXISTS public.study_flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES public.study_areas(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    due_date DATE DEFAULT CURRENT_DATE NOT NULL,
    stability REAL DEFAULT 1.0,
    difficulty REAL DEFAULT 0.3,
    elapsed_days INT DEFAULT 0,
    scheduled_days INT DEFAULT 0,
    reps INT DEFAULT 0,
    lapses INT DEFAULT 0,
    state TEXT DEFAULT 'new',
    last_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_flashcards_user_due ON public.study_flashcards(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_study_flashcards_area ON public.study_flashcards(area_id);

-- Conteúdo Gerado por IA (Cache Divino)
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    content_type public.ai_content_type NOT NULL,
    content JSONB NOT NULL,
    model_used TEXT,
    tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(lesson_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_content_lesson ON public.ai_generated_content(lesson_id);

-- Anotações de Aulas (Rich Text)
CREATE TABLE IF NOT EXISTS public.lesson_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    content_html TEXT,
    timestamp_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_annotations_user_lesson ON public.lesson_annotations(user_id, lesson_id);

-- XP Semanal (Ranking da Arena)
CREATE TABLE IF NOT EXISTS public.weekly_xp (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_this_week INT DEFAULT 0 NOT NULL,
    week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Atualizar FK do profiles para study_areas
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_current_focus_area_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_current_focus_area_fkey 
FOREIGN KEY (current_focus_area_id) REFERENCES public.study_areas(id) ON DELETE SET NULL;
