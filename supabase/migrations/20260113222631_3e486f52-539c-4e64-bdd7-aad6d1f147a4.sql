-- Tabela para controle de versão do app (force refresh)
CREATE TABLE IF NOT EXISTS public.app_version (
  id TEXT PRIMARY KEY DEFAULT 'main',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir registro inicial
INSERT INTO public.app_version (id, version) 
VALUES ('main', 1)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.app_version ENABLE ROW LEVEL SECURITY;

-- Todos podem ler a versão
CREATE POLICY "Anyone can read app version"
ON public.app_version FOR SELECT
USING (true);

-- Apenas owner/admin podem atualizar
CREATE POLICY "Only owner/admin can update version"
ON public.app_version FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Habilitar Realtime para broadcast instantâneo
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_version;