
-- FUNÇÕES DO SANTUÁRIO
CREATE OR REPLACE FUNCTION public.can_access_sanctuary(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_role public.app_role; v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
    IF v_role IN ('owner', 'admin') THEN RETURN TRUE; END IF;
    IF v_role = 'beta' THEN
        SELECT access_expires_at INTO v_expires_at FROM public.profiles WHERE id = p_user_id;
        IF v_expires_at IS NULL OR v_expires_at > NOW() THEN RETURN TRUE; END IF;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS para todas as tabelas
ALTER TABLE public.study_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctuary_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_xp ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas
CREATE POLICY "study_areas_select" ON public.study_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "study_areas_all" ON public.study_areas FOR ALL TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "sanctuary_questions_select" ON public.sanctuary_questions FOR SELECT TO authenticated USING (public.can_access_sanctuary(auth.uid()));
CREATE POLICY "sanctuary_questions_all" ON public.sanctuary_questions FOR ALL TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "question_attempts_all" ON public.question_attempts FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "error_notebook_all" ON public.error_notebook FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "study_flashcards_all" ON public.study_flashcards FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_content_select" ON public.ai_generated_content FOR SELECT TO authenticated USING (public.can_access_sanctuary(auth.uid()));
CREATE POLICY "ai_content_all" ON public.ai_generated_content FOR ALL TO authenticated USING (public.is_owner(auth.uid()));
CREATE POLICY "lesson_annotations_all" ON public.lesson_annotations FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "weekly_xp_select" ON public.weekly_xp FOR SELECT TO authenticated USING (true);
CREATE POLICY "weekly_xp_insert" ON public.weekly_xp FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_xp_update" ON public.weekly_xp FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger caderno de erros
CREATE OR REPLACE FUNCTION public.fn_auto_error_notebook() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_correct = FALSE THEN
        INSERT INTO public.error_notebook (user_id, question_id) VALUES (NEW.user_id, NEW.question_id)
        ON CONFLICT (user_id, question_id) DO UPDATE SET error_count = error_notebook.error_count + 1, last_error_at = NOW(), mastered = FALSE;
    ELSE
        UPDATE public.error_notebook SET mastered = TRUE, mastered_at = NOW() WHERE user_id = NEW.user_id AND question_id = NEW.question_id AND mastered = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_error_notebook ON public.question_attempts;
CREATE TRIGGER trg_auto_error_notebook AFTER INSERT ON public.question_attempts FOR EACH ROW EXECUTE FUNCTION public.fn_auto_error_notebook();
