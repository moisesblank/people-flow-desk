-- ============================================
-- SISTEMA UNIVERSAL DE ANEXOS
-- Integração com todas as áreas do sistema
-- ============================================

-- Tabela universal de anexos
CREATE TABLE IF NOT EXISTS public.universal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência polimórfica para qualquer entidade
  entity_type TEXT NOT NULL, -- 'task', 'calendar_task', 'expense', 'employee', 'student', 'course', 'campaign', 'transaction'
  entity_id TEXT NOT NULL, -- ID da entidade (pode ser UUID ou integer)
  
  -- Informações do arquivo
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Metadados
  title TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  
  -- AI Extraction
  extracted_content TEXT,
  extraction_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  extraction_date TIMESTAMPTZ,
  extraction_model TEXT,
  ai_summary TEXT,
  ai_insights JSONB DEFAULT '{}',
  
  -- Auditoria
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_universal_attachments_entity ON public.universal_attachments(entity_type, entity_id);
CREATE INDEX idx_universal_attachments_user ON public.universal_attachments(uploaded_by);
CREATE INDEX idx_universal_attachments_created ON public.universal_attachments(created_at DESC);
CREATE INDEX idx_universal_attachments_extraction ON public.universal_attachments(extraction_status);

-- Enable RLS
ALTER TABLE public.universal_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view attachments"
  ON public.universal_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert attachments"
  ON public.universal_attachments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own attachments"
  ON public.universal_attachments FOR UPDATE
  USING (auth.uid() = uploaded_by OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can delete own attachments"
  ON public.universal_attachments FOR DELETE
  USING (auth.uid() = uploaded_by OR public.is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_universal_attachments_updated_at
  BEFORE UPDATE ON public.universal_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para contar anexos por entidade
CREATE OR REPLACE FUNCTION public.count_entity_attachments(p_entity_type TEXT, p_entity_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.universal_attachments
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id
$$;

-- Função para buscar anexos de uma entidade
CREATE OR REPLACE FUNCTION public.get_entity_attachments(p_entity_type TEXT, p_entity_id TEXT)
RETURNS SETOF public.universal_attachments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.universal_attachments
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  ORDER BY created_at DESC
$$;