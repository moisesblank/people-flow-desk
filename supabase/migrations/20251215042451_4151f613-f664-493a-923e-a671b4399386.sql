-- =====================================================
-- SISTEMA DE METAS FINANCEIRAS
-- =====================================================

-- Tabela de metas financeiras
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'savings',
  priority text NOT NULL DEFAULT 'medium',
  deadline date,
  status text NOT NULL DEFAULT 'active',
  icon text DEFAULT 'Target',
  color text DEFAULT 'primary',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de histórico de progresso das metas
CREATE TABLE public.goal_progress_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;

-- Policies for financial_goals
CREATE POLICY "Users can view their own goals" 
ON public.financial_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.financial_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.financial_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.financial_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for goal_progress_history
CREATE POLICY "Users can view their goal history" 
ON public.goal_progress_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.financial_goals 
  WHERE financial_goals.id = goal_progress_history.goal_id 
  AND financial_goals.user_id = auth.uid()
));

CREATE POLICY "Users can add to their goal history" 
ON public.goal_progress_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.financial_goals 
  WHERE financial_goals.id = goal_progress_history.goal_id 
  AND financial_goals.user_id = auth.uid()
));

CREATE POLICY "Users can delete their goal history" 
ON public.goal_progress_history 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.financial_goals 
  WHERE financial_goals.id = goal_progress_history.goal_id 
  AND financial_goals.user_id = auth.uid()
));

-- Trigger para updated_at
CREATE TRIGGER update_financial_goals_updated_at
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_progress_history;