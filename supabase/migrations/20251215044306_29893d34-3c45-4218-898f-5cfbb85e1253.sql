
-- =====================================================
-- SISTEMA LMS COMPLETO + GAMIFICAÇÃO
-- =====================================================

-- 1. TABELA DE CURSOS
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  price NUMERIC DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'geral',
  difficulty_level TEXT DEFAULT 'iniciante',
  estimated_hours INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE MÓDULOS
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE AULAS
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 5,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE MATRÍCULAS
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- 5. TABELA DE PROGRESSO DE AULAS
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 6. TABELA DE GAMIFICAÇÃO - PERFIL DO JOGADOR
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  courses_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA DE BADGES/CONQUISTAS
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Award',
  xp_reward INTEGER DEFAULT 10,
  rarity TEXT DEFAULT 'common',
  category TEXT DEFAULT 'geral',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABELA DE BADGES CONQUISTADOS
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 9. TABELA DE HISTÓRICO DE XP
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABELA DE PAGAMENTOS/ASSINATURAS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABELA DE TRANSAÇÕES DE PAGAMENTO
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'brl',
  status TEXT DEFAULT 'pending',
  payment_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - COURSES
-- =====================================================

CREATE POLICY "Cursos publicados são públicos"
ON public.courses FOR SELECT
USING (is_published = true);

CREATE POLICY "Admin gerencia cursos"
ON public.courses FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - MODULES
-- =====================================================

CREATE POLICY "Módulos de cursos publicados são públicos"
ON public.modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = modules.course_id 
    AND courses.is_published = true
  )
);

CREATE POLICY "Admin gerencia módulos"
ON public.modules FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - LESSONS
-- =====================================================

CREATE POLICY "Aulas gratuitas são públicas"
ON public.lessons FOR SELECT
USING (
  is_free = true OR
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.modules m ON m.course_id = e.course_id
    WHERE m.id = lessons.module_id
    AND e.user_id = auth.uid()
    AND e.status = 'active'
  )
);

CREATE POLICY "Admin gerencia aulas"
ON public.lessons FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - ENROLLMENTS
-- =====================================================

CREATE POLICY "Usuário vê próprias matrículas"
ON public.enrollments FOR SELECT
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário pode se matricular"
ON public.enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin gerencia matrículas"
ON public.enrollments FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - LESSON_PROGRESS
-- =====================================================

CREATE POLICY "Usuário gerencia próprio progresso"
ON public.lesson_progress FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin vê progresso"
ON public.lesson_progress FOR SELECT
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - USER_GAMIFICATION
-- =====================================================

CREATE POLICY "Usuário vê própria gamificação"
ON public.user_gamification FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Gamificação pública para leaderboard"
ON public.user_gamification FOR SELECT
USING (true);

CREATE POLICY "Sistema gerencia gamificação"
ON public.user_gamification FOR ALL
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - BADGES
-- =====================================================

CREATE POLICY "Badges são públicos"
ON public.badges FOR SELECT
USING (true);

CREATE POLICY "Admin gerencia badges"
ON public.badges FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - USER_BADGES
-- =====================================================

CREATE POLICY "Usuário vê próprios badges"
ON public.user_badges FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Badges são públicos para perfil"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "Sistema atribui badges"
ON public.user_badges FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - XP_HISTORY
-- =====================================================

CREATE POLICY "Usuário vê próprio histórico XP"
ON public.xp_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Sistema registra XP"
ON public.xp_history FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - SUBSCRIPTIONS
-- =====================================================

CREATE POLICY "Usuário vê própria assinatura"
ON public.subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin gerencia assinaturas"
ON public.subscriptions FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS - PAYMENT_TRANSACTIONS
-- =====================================================

CREATE POLICY "Usuário vê próprias transações"
ON public.payment_transactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin gerencia transações"
ON public.payment_transactions FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA ADICIONAR XP AO USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Inserir no histórico
  INSERT INTO public.xp_history (user_id, amount, source, source_id, description)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description);

  -- Atualizar gamificação do usuário
  INSERT INTO public.user_gamification (user_id, total_xp)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_xp = user_gamification.total_xp + p_amount,
    updated_at = now();

  -- Calcular novo nível (100 XP por nível)
  SELECT total_xp INTO v_new_total
  FROM public.user_gamification
  WHERE user_id = p_user_id;

  v_new_level := GREATEST(1, (v_new_total / 100) + 1);

  -- Atualizar nível
  UPDATE public.user_gamification
  SET current_level = v_new_level
  WHERE user_id = p_user_id;

  RETURN v_new_total;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR STREAK
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_gamification
  WHERE user_id = p_user_id;

  -- Se não existe registro, criar
  IF NOT FOUND THEN
    INSERT INTO public.user_gamification (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE);
    RETURN 1;
  END IF;

  -- Se já ativou hoje, retornar streak atual
  IF v_last_activity = CURRENT_DATE THEN
    RETURN v_current_streak;
  END IF;

  -- Se ativou ontem, incrementar streak
  IF v_last_activity = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
  ELSE
    -- Streak quebrado
    v_current_streak := 1;
  END IF;

  UPDATE public.user_gamification
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_current_streak;
END;
$$;

-- =====================================================
-- INSERIR BADGES PADRÃO
-- =====================================================

INSERT INTO public.badges (name, description, icon, xp_reward, rarity, category, requirement_type, requirement_value) VALUES
('Primeiro Passo', 'Complete sua primeira aula', 'Play', 10, 'common', 'progresso', 'lessons_completed', 1),
('Estudante Dedicado', 'Complete 10 aulas', 'BookOpen', 25, 'common', 'progresso', 'lessons_completed', 10),
('Maratonista', 'Complete 50 aulas', 'Zap', 100, 'rare', 'progresso', 'lessons_completed', 50),
('Mestre do Conhecimento', 'Complete 100 aulas', 'Crown', 250, 'epic', 'progresso', 'lessons_completed', 100),
('Streak de 7 dias', 'Mantenha uma sequência de 7 dias', 'Flame', 50, 'common', 'streak', 'streak_days', 7),
('Streak de 30 dias', 'Mantenha uma sequência de 30 dias', 'Fire', 200, 'rare', 'streak', 'streak_days', 30),
('Streak de 100 dias', 'Mantenha uma sequência de 100 dias', 'Sparkles', 500, 'legendary', 'streak', 'streak_days', 100),
('Primeiro Curso', 'Complete seu primeiro curso', 'GraduationCap', 100, 'common', 'cursos', 'courses_completed', 1),
('Colecionador', 'Complete 5 cursos', 'Trophy', 300, 'rare', 'cursos', 'courses_completed', 5),
('Veterano', 'Complete 10 cursos', 'Star', 500, 'epic', 'cursos', 'courses_completed', 10),
('Lenda', 'Alcance nível 50', 'Medal', 1000, 'legendary', 'nivel', 'level_reached', 50);
