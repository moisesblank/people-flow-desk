-- ============================================
-- MOISÉS MEDEIROS CURSO v6.0 - LMS DATABASE (PARTE 1)
-- Tabelas e estruturas principais (sem usar novos enum values)
-- ============================================

-- 1. ATUALIZAR TABELA PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "system", "notifications": true, "language": "pt-BR"}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. CRIAR TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias são públicas para leitura" ON public.categories;
CREATE POLICY "Categorias são públicas para leitura" 
ON public.categories FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admin gerencia categorias" ON public.categories;
CREATE POLICY "Admin gerencia categorias" 
ON public.categories FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 3. ATUALIZAR TABELA COURSES (adicionar campos LMS)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS preview_video_url TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 4. ATUALIZAR TABELA LESSONS (adicionar campos)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS video_duration INTEGER DEFAULT 0;

-- 5. CRIAR TABELA DE CERTIFICADOS
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT,
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê próprios certificados" ON public.certificates;
CREATE POLICY "Usuário vê próprios certificados" 
ON public.certificates FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin gerencia certificados" ON public.certificates;
CREATE POLICY "Admin gerencia certificados" 
ON public.certificates FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 6. CRIAR TABELA DE NOTAS/ANOTAÇÕES
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia próprias notas" ON public.lesson_notes;
CREATE POLICY "Usuário gerencia próprias notas" 
ON public.lesson_notes FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- 7. CRIAR TABELA DE CONQUISTAS/ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  xp_reward INTEGER DEFAULT 10,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER DEFAULT 1,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements são públicos" ON public.achievements;
CREATE POLICY "Achievements são públicos" 
ON public.achievements FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admin gerencia achievements" ON public.achievements;
CREATE POLICY "Admin gerencia achievements" 
ON public.achievements FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid())) 
WITH CHECK (is_admin_or_owner(auth.uid()));

-- 8. CRIAR TABELA DE USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê próprios achievements" ON public.user_achievements;
CREATE POLICY "Usuário vê próprios achievements" 
ON public.user_achievements FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Sistema insere achievements" ON public.user_achievements;
CREATE POLICY "Sistema insere achievements" 
ON public.user_achievements FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 9. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_user ON public.lesson_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson ON public.lesson_notes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_achievements_code ON public.achievements(code);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);