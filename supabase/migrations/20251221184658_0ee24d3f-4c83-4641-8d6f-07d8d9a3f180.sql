
-- =====================================================================
-- 🛡️ CAMADA 2: A MURALHA DA LÓGICA (RLS DO SANTUÁRIO)
-- Aplicando políticas nas tabelas existentes
-- =====================================================================

-- LESSONS: Acesso ao Santuário
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lessons viewable by enrolled users" ON public.lessons;
DROP POLICY IF EXISTS "Lessons accessible by sanctuary users" ON public.lessons;
CREATE POLICY "Lessons accessible by sanctuary users" ON public.lessons 
    FOR SELECT TO authenticated 
    USING (is_free = true OR public.can_access_sanctuary(auth.uid()));
DROP POLICY IF EXISTS "Lessons manageable by owner" ON public.lessons;
CREATE POLICY "Lessons manageable by owner" ON public.lessons 
    FOR ALL TO authenticated 
    USING (public.is_owner(auth.uid()));

-- LESSON_PROGRESS: Dados pessoais do aluno
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_all" ON public.lesson_progress;
CREATE POLICY "lesson_progress_all" ON public.lesson_progress 
    FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

-- QUIZZES: Acesso ao Santuário
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quizzes viewable by authenticated" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes accessible by sanctuary users" ON public.quizzes;
CREATE POLICY "Quizzes accessible by sanctuary users" ON public.quizzes 
    FOR SELECT TO authenticated 
    USING (public.can_access_sanctuary(auth.uid()));
DROP POLICY IF EXISTS "Quizzes manageable by owner" ON public.quizzes;
CREATE POLICY "Quizzes manageable by owner" ON public.quizzes 
    FOR ALL TO authenticated 
    USING (public.is_owner(auth.uid()));

-- QUIZ_QUESTIONS: Acesso ao Santuário
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quiz questions viewable by authenticated" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_select" ON public.quiz_questions;
CREATE POLICY "quiz_questions_select" ON public.quiz_questions 
    FOR SELECT TO authenticated 
    USING (public.can_access_sanctuary(auth.uid()));
DROP POLICY IF EXISTS "quiz_questions_manage" ON public.quiz_questions;
CREATE POLICY "quiz_questions_manage" ON public.quiz_questions 
    FOR ALL TO authenticated 
    USING (public.is_owner(auth.uid()));

-- QUIZ_ATTEMPTS: Dados pessoais
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_all" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_all" ON public.quiz_attempts 
    FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

-- MODULES: Acesso ao Santuário
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Modules viewable by enrolled users" ON public.modules;
DROP POLICY IF EXISTS "modules_select" ON public.modules;
CREATE POLICY "modules_select" ON public.modules 
    FOR SELECT TO authenticated 
    USING (public.can_access_sanctuary(auth.uid()));
DROP POLICY IF EXISTS "modules_manage" ON public.modules;
CREATE POLICY "modules_manage" ON public.modules 
    FOR ALL TO authenticated 
    USING (public.is_owner(auth.uid()));

-- COURSES: Alguns são públicos, outros do Santuário
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Courses viewable by all" ON public.courses;
DROP POLICY IF EXISTS "courses_select" ON public.courses;
CREATE POLICY "courses_select" ON public.courses 
    FOR SELECT TO authenticated 
    USING (is_published = true OR public.can_access_sanctuary(auth.uid()));
DROP POLICY IF EXISTS "courses_manage" ON public.courses;
CREATE POLICY "courses_manage" ON public.courses 
    FOR ALL TO authenticated 
    USING (public.is_owner(auth.uid()));
