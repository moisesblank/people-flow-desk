-- =====================================================
-- TABELA DE CHECKLISTS INTELIGENTES
-- Sistema de checklists com IA integrada
-- =====================================================

CREATE TABLE IF NOT EXISTS public.smart_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  category TEXT,
  ai_suggested BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_smart_checklists_entity ON public.smart_checklists(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_smart_checklists_completed ON public.smart_checklists(completed);
CREATE INDEX IF NOT EXISTS idx_smart_checklists_priority ON public.smart_checklists(priority);

-- Enable RLS
ALTER TABLE public.smart_checklists ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage all checklists"
  ON public.smart_checklists FOR ALL
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can view their own checklists"
  ON public.smart_checklists FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create checklists"
  ON public.smart_checklists FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own checklists"
  ON public.smart_checklists FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can delete their own checklists"
  ON public.smart_checklists FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_smart_checklists_updated_at
  BEFORE UPDATE ON public.smart_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();