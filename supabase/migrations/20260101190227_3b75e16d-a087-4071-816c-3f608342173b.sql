-- Tabela para histórico de importações de questões
CREATE TABLE IF NOT EXISTS public.question_import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id),
  file_names TEXT[] NOT NULL DEFAULT '{}',
  total_files INTEGER NOT NULL DEFAULT 1,
  total_questions INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  target_group TEXT NOT NULL DEFAULT 'MODO_TREINO', -- SIMULADOS ou MODO_TREINO
  campos_inferidos TEXT[] DEFAULT '{}',
  campos_null TEXT[] DEFAULT '{}',
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' -- completed, partial, failed
);

-- Índices para performance
CREATE INDEX idx_question_import_history_created_at ON public.question_import_history(created_at DESC);
CREATE INDEX idx_question_import_history_imported_by ON public.question_import_history(imported_by);

-- RLS
ALTER TABLE public.question_import_history ENABLE ROW LEVEL SECURITY;

-- Políticas: Owner e Admin podem ver tudo
CREATE POLICY "Owner e Admin podem ver histórico de importações"
  ON public.question_import_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Políticas: Inserção para staff de gestão
CREATE POLICY "Staff pode inserir histórico de importação"
  ON public.question_import_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

COMMENT ON TABLE public.question_import_history IS 'Histórico de importações de questões - rastreabilidade completa';