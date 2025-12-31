-- =============================================
-- CRONOGRAMA MANAGEMENT + REALTIME SYNC
-- Tabelas para cronograma de estudos com gestão
-- =============================================

-- 1. TABELA: Planos de Estudo (templates de cronograma)
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER DEFAULT 12,
    target_exam TEXT DEFAULT 'ENEM',
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'intensive')),
    weekly_hours INTEGER DEFAULT 20,
    is_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: Blocos de Estudo (itens do cronograma)
CREATE TABLE IF NOT EXISTS public.study_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.study_plans(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    activity_type TEXT DEFAULT 'study' CHECK (activity_type IN ('study', 'revision', 'practice', 'exam', 'break', 'custom')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    week_number INTEGER DEFAULT 1,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'rescheduled')),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: Metas de Estudo
CREATE TABLE IF NOT EXISTS public.study_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.study_plans(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT DEFAULT 'weekly' CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'custom')),
    target_value INTEGER DEFAULT 1,
    current_value INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'hours',
    subject TEXT,
    start_date DATE,
    end_date DATE,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: Progresso do Cronograma
CREATE TABLE IF NOT EXISTS public.schedule_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    block_id UUID REFERENCES public.study_blocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    planned_minutes INTEGER DEFAULT 0,
    actual_minutes INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'tired', 'stressed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_study_plans_created_by ON public.study_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_study_plans_active ON public.study_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_study_blocks_plan_id ON public.study_blocks(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_blocks_student_id ON public.study_blocks(student_id);
CREATE INDEX IF NOT EXISTS idx_study_blocks_day_week ON public.study_blocks(day_of_week, week_number);
CREATE INDEX IF NOT EXISTS idx_study_goals_student_id ON public.study_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_schedule_progress_student_date ON public.schedule_progress(student_id, date);

-- 6. RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_progress ENABLE ROW LEVEL SECURITY;

-- Policies: study_plans
CREATE POLICY "Gestão pode ver todos os planos" ON public.study_plans
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao', 'monitoria'))
        OR created_by = auth.uid()
        OR is_template = true
    );

CREATE POLICY "Gestão pode criar planos" ON public.study_plans
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
    );

CREATE POLICY "Gestão pode atualizar planos" ON public.study_plans
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
        OR created_by = auth.uid()
    );

CREATE POLICY "Owner/Admin pode deletar planos" ON public.study_plans
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Policies: study_blocks
CREATE POLICY "Gestão pode ver todos os blocos" ON public.study_blocks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao', 'monitoria'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Gestão e alunos podem criar blocos" ON public.study_blocks
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Gestão e alunos podem atualizar blocos" ON public.study_blocks
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Owner/Admin pode deletar blocos" ON public.study_blocks
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        OR student_id = auth.uid()
    );

-- Policies: study_goals
CREATE POLICY "Gestão pode ver todas as metas" ON public.study_goals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao', 'monitoria'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Gestão e alunos podem criar metas" ON public.study_goals
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Gestão e alunos podem atualizar metas" ON public.study_goals
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Owner/Admin pode deletar metas" ON public.study_goals
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        OR student_id = auth.uid()
    );

-- Policies: schedule_progress
CREATE POLICY "Gestão pode ver todo o progresso" ON public.schedule_progress
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coordenacao', 'monitoria'))
        OR student_id = auth.uid()
    );

CREATE POLICY "Alunos podem registrar progresso" ON public.schedule_progress
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Alunos podem atualizar próprio progresso" ON public.schedule_progress
    FOR UPDATE USING (student_id = auth.uid());

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_cronograma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_study_plans_updated_at
    BEFORE UPDATE ON public.study_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_cronograma_updated_at();

CREATE TRIGGER update_study_blocks_updated_at
    BEFORE UPDATE ON public.study_blocks
    FOR EACH ROW EXECUTE FUNCTION public.update_cronograma_updated_at();

CREATE TRIGGER update_study_goals_updated_at
    BEFORE UPDATE ON public.study_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_cronograma_updated_at();

-- 8. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_progress;