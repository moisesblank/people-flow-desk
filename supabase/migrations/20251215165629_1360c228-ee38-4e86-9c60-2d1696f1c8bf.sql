-- ═══════════════════════════════════════════════════════════════
-- MODO DEUS - Funções de Segurança e Histórico de Conteúdo
-- Email Owner: moisesblank@gmail.com
-- ═══════════════════════════════════════════════════════════════

-- Função is_owner() - Verifica se é O DONO (MODO DEUS)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id 
    AND u.email = 'moisesblank@gmail.com'
  )
$$;

-- Função can_use_god_mode() - Permissão MODO DEUS
CREATE OR REPLACE FUNCTION public.can_use_god_mode(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_owner(_user_id)
$$;

-- Função can_edit_content() - Permissão edição visual
CREATE OR REPLACE FUNCTION public.can_edit_content(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_owner(_user_id)
$$;

-- Função can_view_all_data() - Ver dados de TODOS
CREATE OR REPLACE FUNCTION public.can_view_all_data(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_owner(_user_id)
$$;

-- ═══════════════════════════════════════════════════════════════
-- HISTÓRICO DE CONTEÚDO (para reverter alterações do MODO DEUS)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_history_key ON public.content_history(content_key);
CREATE INDEX IF NOT EXISTS idx_content_history_date ON public.content_history(changed_at DESC);

ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- Apenas owner pode ver o histórico
DROP POLICY IF EXISTS "only_owner_can_view_history" ON public.content_history;
CREATE POLICY "only_owner_can_view_history" ON public.content_history
  FOR SELECT TO authenticated USING (public.is_owner());

-- Sistema pode inserir histórico
DROP POLICY IF EXISTS "system_insert_history" ON public.content_history;
CREATE POLICY "system_insert_history" ON public.content_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Atualizar RLS do editable_content para usar is_owner()
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "only_owner_can_update_content" ON public.editable_content;
CREATE POLICY "only_owner_can_update_content" ON public.editable_content
  FOR UPDATE TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "only_owner_can_insert_content" ON public.editable_content;
CREATE POLICY "only_owner_can_insert_content" ON public.editable_content
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "only_owner_can_delete_content" ON public.editable_content;
CREATE POLICY "only_owner_can_delete_content" ON public.editable_content
  FOR DELETE TO authenticated
  USING (public.is_owner());

-- ═══════════════════════════════════════════════════════════════
-- Trigger para salvar histórico automaticamente
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.save_content_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Salvar no histórico
  INSERT INTO public.content_history (content_key, old_value, new_value, changed_by, version)
  VALUES (
    NEW.content_key, 
    OLD.content_value, 
    NEW.content_value, 
    auth.uid(),
    COALESCE((SELECT MAX(version) + 1 FROM public.content_history WHERE content_key = NEW.content_key), 1)
  );
  
  NEW.updated_at := NOW();
  NEW.updated_by := auth.uid();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_content_updated ON public.editable_content;
CREATE TRIGGER on_content_updated
  BEFORE UPDATE ON public.editable_content
  FOR EACH ROW EXECUTE FUNCTION public.save_content_history();