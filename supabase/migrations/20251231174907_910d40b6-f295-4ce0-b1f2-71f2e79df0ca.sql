-- =============================================
-- SISTEMA DE PLANEJAMENTO SEMANAL
-- Gestão: /gestaofc/planejamento
-- Alunos: /alunos/planejamento
-- =============================================

-- 1. SEMANAS DE PLANEJAMENTO (Templates criados pela gestão)
CREATE TABLE public.planning_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  start_date DATE,
  end_date DATE,
  thumbnail_url TEXT,
  estimated_hours INTEGER DEFAULT 10,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_template BOOLEAN DEFAULT false,
  course_id UUID REFERENCES public.courses(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. AULAS/ITENS DO PLANEJAMENTO
CREATE TABLE public.planning_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.planning_weeks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_provider TEXT DEFAULT 'panda' CHECK (video_provider IN ('panda', 'youtube', 'vimeo')),
  duration_minutes INTEGER DEFAULT 30,
  position INTEGER NOT NULL DEFAULT 0,
  lesson_type TEXT DEFAULT 'video' CHECK (lesson_type IN ('video', 'reading', 'exercise', 'quiz', 'live')),
  is_required BOOLEAN DEFAULT true,
  estimated_time_minutes INTEGER DEFAULT 45,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. MATERIAIS DAS AULAS
CREATE TABLE public.planning_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.planning_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'doc', 'ppt', 'image', 'video', 'link')),
  file_size INTEGER,
  is_downloadable BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TÓPICOS DE REVISÃO
CREATE TABLE public.planning_review_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.planning_lessons(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PROGRESSO DO ALUNO NAS SEMANAS
CREATE TABLE public.planning_week_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_id UUID NOT NULL REFERENCES public.planning_weeks(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_id)
);

-- 6. PROGRESSO DO ALUNO NAS AULAS
CREATE TABLE public.planning_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.planning_lessons(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  video_position_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 7. NOTAS/ANOTAÇÕES DO ALUNO
CREATE TABLE public.planning_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.planning_lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER,
  color TEXT DEFAULT '#FFEB3B',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. AVALIAÇÕES DAS AULAS
CREATE TABLE public.planning_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.planning_lessons(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 9. FÓRUM/DÚVIDAS INTEGRADO
CREATE TABLE public.planning_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.planning_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.planning_discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.planning_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_review_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_week_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_discussions ENABLE ROW LEVEL SECURITY;

-- Gestão pode tudo nas semanas
CREATE POLICY "Gestão pode gerenciar semanas" ON public.planning_weeks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

-- Alunos podem ver semanas ativas
CREATE POLICY "Alunos podem ver semanas ativas" ON public.planning_weeks
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('beta', 'aluno_gratuito'))
  );

-- Gestão pode gerenciar aulas
CREATE POLICY "Gestão pode gerenciar aulas" ON public.planning_lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

-- Alunos podem ver aulas de semanas ativas
CREATE POLICY "Alunos podem ver aulas" ON public.planning_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.planning_weeks pw
      WHERE pw.id = week_id AND pw.status = 'active'
    ) AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('beta', 'aluno_gratuito'))
  );

-- Gestão pode gerenciar materiais
CREATE POLICY "Gestão pode gerenciar materiais" ON public.planning_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

-- Alunos podem ver materiais
CREATE POLICY "Alunos podem ver materiais" ON public.planning_materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('beta', 'aluno_gratuito'))
  );

-- Gestão pode gerenciar tópicos de revisão
CREATE POLICY "Gestão pode gerenciar tópicos" ON public.planning_review_topics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

-- Alunos podem ver tópicos
CREATE POLICY "Alunos podem ver tópicos" ON public.planning_review_topics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('beta', 'aluno_gratuito'))
  );

-- Progresso de semanas - usuário só acessa o próprio
CREATE POLICY "Usuário gerencia próprio progresso de semana" ON public.planning_week_progress
  FOR ALL USING (user_id = auth.uid());

-- Gestão pode ver todos os progressos
CREATE POLICY "Gestão pode ver todos progressos semana" ON public.planning_week_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

-- Progresso de aulas - usuário só acessa o próprio
CREATE POLICY "Usuário gerencia próprio progresso de aula" ON public.planning_lesson_progress
  FOR ALL USING (user_id = auth.uid());

-- Gestão pode ver todos os progressos
CREATE POLICY "Gestão pode ver todos progressos aula" ON public.planning_lesson_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
  );

-- Notas - usuário só acessa as próprias
CREATE POLICY "Usuário gerencia próprias notas" ON public.planning_notes
  FOR ALL USING (user_id = auth.uid());

-- Avaliações - usuário só acessa as próprias
CREATE POLICY "Usuário gerencia próprias avaliações" ON public.planning_ratings
  FOR ALL USING (user_id = auth.uid());

-- Discussões - todos podem ver, usuário pode gerenciar as próprias
CREATE POLICY "Todos podem ver discussões" ON public.planning_discussions
  FOR SELECT USING (true);

CREATE POLICY "Usuário pode criar discussões" ON public.planning_discussions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário pode atualizar próprias discussões" ON public.planning_discussions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuário pode deletar próprias discussões" ON public.planning_discussions
  FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_planning_weeks_status ON public.planning_weeks(status);
CREATE INDEX idx_planning_weeks_course ON public.planning_weeks(course_id);
CREATE INDEX idx_planning_lessons_week ON public.planning_lessons(week_id);
CREATE INDEX idx_planning_lessons_position ON public.planning_lessons(week_id, position);
CREATE INDEX idx_planning_materials_lesson ON public.planning_materials(lesson_id);
CREATE INDEX idx_planning_review_lesson ON public.planning_review_topics(lesson_id);
CREATE INDEX idx_planning_week_progress_user ON public.planning_week_progress(user_id);
CREATE INDEX idx_planning_lesson_progress_user ON public.planning_lesson_progress(user_id);
CREATE INDEX idx_planning_notes_user ON public.planning_notes(user_id);
CREATE INDEX idx_planning_notes_lesson ON public.planning_notes(lesson_id);
CREATE INDEX idx_planning_ratings_lesson ON public.planning_ratings(lesson_id);
CREATE INDEX idx_planning_discussions_lesson ON public.planning_discussions(lesson_id);
CREATE INDEX idx_planning_discussions_parent ON public.planning_discussions(parent_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_planning_weeks_updated_at
  BEFORE UPDATE ON public.planning_weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_lessons_updated_at
  BEFORE UPDATE ON public.planning_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_week_progress_updated_at
  BEFORE UPDATE ON public.planning_week_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_lesson_progress_updated_at
  BEFORE UPDATE ON public.planning_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_notes_updated_at
  BEFORE UPDATE ON public.planning_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_ratings_updated_at
  BEFORE UPDATE ON public.planning_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_discussions_updated_at
  BEFORE UPDATE ON public.planning_discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_weeks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_review_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_week_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_lesson_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_discussions;