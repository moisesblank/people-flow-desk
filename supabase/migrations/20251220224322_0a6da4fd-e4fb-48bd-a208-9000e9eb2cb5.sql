-- Tabela para gerenciar menus dinâmicos criados pelo Owner/Master
CREATE TABLE public.dynamic_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL, -- ex: 'principal', 'empresas', 'marketing'
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'FileText', -- Nome do ícone Lucide
  area TEXT NOT NULL, -- SystemArea para permissões
  badge TEXT, -- Badge opcional (ex: 'NEW', 'BETA')
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dynamic_menu_items ENABLE ROW LEVEL SECURITY;

-- Apenas Owner pode gerenciar menus
CREATE POLICY "Owner can manage all menu items"
ON public.dynamic_menu_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
  OR
  auth.jwt() ->> 'email' = 'moisesblank@gmail.com'
);

-- Todos autenticados podem ler menus ativos
CREATE POLICY "Authenticated users can read active menu items"
ON public.dynamic_menu_items
FOR SELECT
TO authenticated
USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_dynamic_menu_items_updated_at
BEFORE UPDATE ON public.dynamic_menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dynamic_menu_items;

-- Adicionar 'aluno' como novo role se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'coordenacao', 'suporte', 'monitoria', 'afiliado', 'marketing', 'contabilidade', 'administrativo', 'aluno');
  ELSE
    -- Tentar adicionar 'aluno' ao enum existente
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';
    EXCEPTION WHEN OTHERS THEN
      -- Ignora se já existir
      NULL;
    END;
  END IF;
END $$;