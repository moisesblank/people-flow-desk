-- =====================================================
-- EDITOR VISUAL DE MENU - TABELAS E POLÍTICAS
-- =====================================================

-- 1. Tabela de Grupos do Menu
CREATE TABLE public.menu_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key TEXT UNIQUE NOT NULL,
  group_label TEXT NOT NULL,
  group_icon TEXT,
  group_color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Itens do Menu
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.menu_groups(id) ON DELETE CASCADE,
  item_key TEXT UNIQUE NOT NULL,
  item_label TEXT NOT NULL,
  item_url TEXT NOT NULL,
  item_icon TEXT NOT NULL,
  item_area TEXT,
  item_badge TEXT,
  item_badge_variant TEXT,
  allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin'],
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  opens_in_new_tab BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX idx_menu_items_group ON public.menu_items(group_id);
CREATE INDEX idx_menu_items_sort ON public.menu_items(group_id, sort_order);
CREATE INDEX idx_menu_groups_sort ON public.menu_groups(sort_order);
CREATE INDEX idx_menu_groups_active ON public.menu_groups(is_active);
CREATE INDEX idx_menu_items_active ON public.menu_items(is_active);

-- 4. Triggers de updated_at
CREATE TRIGGER update_menu_groups_updated_at
  BEFORE UPDATE ON public.menu_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE public.menu_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Leitura (gestão pode ler)
CREATE POLICY "Gestão pode ler menu_groups"
  ON public.menu_groups FOR SELECT
  USING (public.is_gestao_staff(auth.uid()));

CREATE POLICY "Gestão pode ler menu_items"
  ON public.menu_items FOR SELECT
  USING (public.is_gestao_staff(auth.uid()));

-- 7. Políticas de Escrita (apenas owner)
CREATE POLICY "Owner pode inserir menu_groups"
  ON public.menu_groups FOR INSERT
  WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owner pode atualizar menu_groups"
  ON public.menu_groups FOR UPDATE
  USING (public.is_owner(auth.uid()));

CREATE POLICY "Owner pode deletar menu_groups"
  ON public.menu_groups FOR DELETE
  USING (public.is_owner(auth.uid()) AND is_system = false);

CREATE POLICY "Owner pode inserir menu_items"
  ON public.menu_items FOR INSERT
  WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owner pode atualizar menu_items"
  ON public.menu_items FOR UPDATE
  USING (public.is_owner(auth.uid()));

CREATE POLICY "Owner pode deletar menu_items"
  ON public.menu_items FOR DELETE
  USING (public.is_owner(auth.uid()) AND is_system = false);

-- 8. Comentários para documentação
COMMENT ON TABLE public.menu_groups IS 'Grupos do menu lateral da gestão - Editor Visual de Menu';
COMMENT ON TABLE public.menu_items IS 'Itens do menu lateral da gestão - Editor Visual de Menu';
COMMENT ON COLUMN public.menu_groups.is_system IS 'Grupos do sistema não podem ser excluídos';
COMMENT ON COLUMN public.menu_items.is_system IS 'Itens do sistema não podem ser excluídos';
COMMENT ON COLUMN public.menu_items.allowed_roles IS 'Roles que podem ver este item (RBAC)';