-- ============================================
-- TABELA: question_error_reports
-- Erros reportados por alunos em questões
-- ============================================

CREATE TABLE public.question_error_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  error_message TEXT NOT NULL,
  source_page TEXT DEFAULT 'questoes', -- 'questoes' ou 'simulados'
  simulado_id UUID, -- Se veio de um simulado
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'em_analise', 'resolvido', 'descartado'
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_question_error_reports_status ON public.question_error_reports(status);
CREATE INDEX idx_question_error_reports_question ON public.question_error_reports(question_id);
CREATE INDEX idx_question_error_reports_created ON public.question_error_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.question_error_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Alunos podem inserir seus próprios reports
CREATE POLICY "Alunos podem reportar erros"
ON public.question_error_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Alunos podem ver seus próprios reports
CREATE POLICY "Alunos podem ver seus reports"
ON public.question_error_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Gestão pode ver todos os reports
CREATE POLICY "Gestao pode ver todos os reports"
ON public.question_error_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao', 'monitoria', 'suporte')
  )
);

-- Policy: Gestão pode atualizar reports
CREATE POLICY "Gestao pode atualizar reports"
ON public.question_error_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_question_error_reports_updated_at
BEFORE UPDATE ON public.question_error_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();