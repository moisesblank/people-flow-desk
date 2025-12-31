-- ============================================
-- TUTORIA MANAGEMENT SYSTEM
-- Tabela para gerenciar sessões de tutoria e logs de IA
-- ============================================

-- Tabela de sessões de tutoria humana (agendamentos)
CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_email TEXT,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tutor_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'individual' CHECK (session_type IN ('individual', 'group', 'live', 'recorded')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  meeting_url TEXT,
  recording_url TEXT,
  notes TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de logs de interações com IA Tutor
CREATE TABLE IF NOT EXISTS public.ai_tutor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  mode TEXT NOT NULL DEFAULT 'tutor' CHECK (mode IN ('tutor', 'redacao', 'flashcards', 'cronograma')),
  user_message TEXT NOT NULL,
  ai_response TEXT,
  lesson_context TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  was_helpful BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de dúvidas dos alunos (para monitoria responder)
CREATE TABLE IF NOT EXISTS public.student_doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_email TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  subject TEXT,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'answered', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_name TEXT,
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]',
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_doubts ENABLE ROW LEVEL SECURITY;

-- Políticas para tutoring_sessions
CREATE POLICY "Gestão pode ver todas as sessões de tutoria"
  ON public.tutoring_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

CREATE POLICY "Gestão pode gerenciar sessões de tutoria"
  ON public.tutoring_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

CREATE POLICY "Alunos podem ver suas próprias sessões"
  ON public.tutoring_sessions FOR SELECT
  USING (student_id = auth.uid());

-- Políticas para ai_tutor_logs
CREATE POLICY "Gestão pode ver todos os logs de IA"
  ON public.ai_tutor_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

CREATE POLICY "Usuários podem inserir seus próprios logs"
  ON public.ai_tutor_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem ver seus próprios logs"
  ON public.ai_tutor_logs FOR SELECT
  USING (user_id = auth.uid());

-- Políticas para student_doubts
CREATE POLICY "Gestão pode ver todas as dúvidas"
  ON public.student_doubts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria', 'suporte')
    )
  );

CREATE POLICY "Gestão pode gerenciar dúvidas"
  ON public.student_doubts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria', 'suporte')
    )
  );

CREATE POLICY "Alunos podem criar dúvidas"
  ON public.student_doubts FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Alunos podem ver suas próprias dúvidas"
  ON public.student_doubts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Alunos podem ver dúvidas públicas"
  ON public.student_doubts FOR SELECT
  USING (is_public = true);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student ON public.tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor ON public.tutoring_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON public.tutoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_scheduled ON public.tutoring_sessions(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_logs_user ON public.ai_tutor_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_logs_mode ON public.ai_tutor_logs(mode);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_logs_created ON public.ai_tutor_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_doubts_student ON public.student_doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_doubts_status ON public.student_doubts(status);
CREATE INDEX IF NOT EXISTS idx_student_doubts_assigned ON public.student_doubts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_student_doubts_created ON public.student_doubts(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_tutoria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutoring_sessions_updated_at
  BEFORE UPDATE ON public.tutoring_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_tutoria_updated_at();

CREATE TRIGGER update_student_doubts_updated_at
  BEFORE UPDATE ON public.student_doubts
  FOR EACH ROW EXECUTE FUNCTION public.update_tutoria_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tutoring_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_tutor_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_doubts;