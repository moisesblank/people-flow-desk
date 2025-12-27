-- ============================================
-- UI_SETTINGS: Configurações globais de UI
-- Sidebar width controlada apenas pelo OWNER
-- ============================================

-- Tabela para configurações de UI globais
CREATE TABLE IF NOT EXISTS public.ui_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  sidebar_width INTEGER NOT NULL DEFAULT 240,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir configuração padrão
INSERT INTO public.ui_settings (id, sidebar_width) 
VALUES ('global', 240)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.ui_settings ENABLE ROW LEVEL SECURITY;

-- Todos podem ler
CREATE POLICY "Anyone can read ui_settings"
ON public.ui_settings
FOR SELECT
TO authenticated
USING (true);

-- Apenas owner pode atualizar
CREATE POLICY "Only owner can update ui_settings"
ON public.ui_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Apenas owner pode inserir (caso não exista)
CREATE POLICY "Only owner can insert ui_settings"
ON public.ui_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Habilitar realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.ui_settings;