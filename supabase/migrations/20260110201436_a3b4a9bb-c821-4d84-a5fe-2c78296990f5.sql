-- ============================================
-- 📄 MATERIAIS PDF - Tabela Principal
-- Sistema completo de gestão de PDFs
-- ============================================

-- Enum para status do material
CREATE TYPE material_status AS ENUM ('draft', 'processing', 'ready', 'archived');

-- Tabela principal de materiais
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'outros',
  tags TEXT[] DEFAULT '{}',
  
  -- Status e visibilidade
  status material_status NOT NULL DEFAULT 'draft',
  is_premium BOOLEAN NOT NULL DEFAULT true,
  required_roles TEXT[] NOT NULL DEFAULT ARRAY['beta', 'owner', 'admin'],
  
  -- Arquivo original
  bucket TEXT NOT NULL DEFAULT 'materiais',
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  total_pages INTEGER DEFAULT 0,
  
  -- Capa
  cover_path TEXT,
  cover_url TEXT,
  
  -- Proteção
  watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Estatísticas
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  
  -- Ordenação
  position INTEGER DEFAULT 0,
  
  -- Vínculo com curso (opcional)
  course_id UUID REFERENCES public.courses(id)
);

-- Índices para performance
CREATE INDEX idx_materials_status ON public.materials(status);
CREATE INDEX idx_materials_category ON public.materials(category);
CREATE INDEX idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX idx_materials_course_id ON public.materials(course_id);

-- Trigger para updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (usando cast para TEXT)
-- Gestão pode ver todos
CREATE POLICY "materials_select_gestao" ON public.materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

-- Alunos podem ver apenas materiais prontos e com role permitida
CREATE POLICY "materials_select_alunos" ON public.materials
  FOR SELECT
  USING (
    status = 'ready'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role::text = ANY(required_roles)
    )
  );

-- Apenas gestão pode inserir
CREATE POLICY "materials_insert_gestao" ON public.materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('owner', 'admin', 'coordenacao')
    )
  );

-- Apenas gestão pode atualizar
CREATE POLICY "materials_update_gestao" ON public.materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('owner', 'admin', 'coordenacao')
    )
  );

-- Apenas owner/admin pode deletar
CREATE POLICY "materials_delete_admin" ON public.materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('owner', 'admin')
    )
  );

-- ============================================
-- 📊 LOGS DE ACESSO A MATERIAIS
-- ============================================

CREATE TABLE public.material_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Tipo de evento
  event_type TEXT NOT NULL,
  
  -- Metadados
  user_email TEXT,
  user_name TEXT,
  page_number INTEGER,
  ip_hash TEXT,
  device_fingerprint TEXT,
  
  -- Violações
  is_violation BOOLEAN DEFAULT false,
  violation_type TEXT,
  threat_score INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX idx_material_access_logs_material ON public.material_access_logs(material_id);
CREATE INDEX idx_material_access_logs_user ON public.material_access_logs(user_id);
CREATE INDEX idx_material_access_logs_created ON public.material_access_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.material_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "material_logs_select_gestao" ON public.material_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('owner', 'admin')
    )
  );

CREATE POLICY "material_logs_insert_auth" ON public.material_access_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;