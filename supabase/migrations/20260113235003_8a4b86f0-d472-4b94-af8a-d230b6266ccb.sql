-- Tabela para observações dos alunos por semana
CREATE TABLE public.student_week_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_id UUID NOT NULL REFERENCES public.planning_weeks(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_id)
);

-- Enable RLS
ALTER TABLE public.student_week_observations ENABLE ROW LEVEL SECURITY;

-- Policies: alunos só veem e editam suas próprias observações
CREATE POLICY "Users can view their own observations"
ON public.student_week_observations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own observations"
ON public.student_week_observations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own observations"
ON public.student_week_observations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own observations"
ON public.student_week_observations FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_student_week_observations_updated_at
BEFORE UPDATE ON public.student_week_observations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para comentários do fórum por aula (lesson_comments)
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Policies: todos autenticados podem ver, mas só editam os próprios
CREATE POLICY "Authenticated users can view all comments"
ON public.lesson_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own comments"
ON public.lesson_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.lesson_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.lesson_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_week_observations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_comments;