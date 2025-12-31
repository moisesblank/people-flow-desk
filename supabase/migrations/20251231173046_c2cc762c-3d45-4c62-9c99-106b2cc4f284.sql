-- ============================================
-- FORUM MANAGEMENT SYSTEM
-- Tabelas para gerenciar tópicos e posts do fórum
-- ============================================

-- Categorias do fórum
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'MessageSquare',
  color TEXT DEFAULT 'blue',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tópicos do fórum
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  author_email TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pinned', 'archived')),
  is_pinned BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  is_solved BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Respostas/Posts do fórum
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  likes_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Likes em tópicos/posts
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT forum_likes_unique_topic UNIQUE (user_id, topic_id),
  CONSTRAINT forum_likes_unique_post UNIQUE (user_id, post_id),
  CONSTRAINT forum_likes_check CHECK (
    (topic_id IS NOT NULL AND post_id IS NULL) OR 
    (topic_id IS NULL AND post_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para forum_categories (público pode ver, gestão pode gerenciar)
CREATE POLICY "Todos podem ver categorias ativas"
  ON public.forum_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Gestão pode gerenciar categorias"
  ON public.forum_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

-- Políticas para forum_topics
CREATE POLICY "Todos autenticados podem ver tópicos"
  ON public.forum_topics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar tópicos"
  ON public.forum_topics FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Autores podem editar seus tópicos"
  ON public.forum_topics FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Gestão pode gerenciar todos os tópicos"
  ON public.forum_topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

-- Políticas para forum_posts
CREATE POLICY "Todos autenticados podem ver posts"
  ON public.forum_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem criar posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Autores podem editar seus posts"
  ON public.forum_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Gestão pode gerenciar todos os posts"
  ON public.forum_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao', 'monitoria')
    )
  );

-- Políticas para forum_likes
CREATE POLICY "Usuários podem ver likes"
  ON public.forum_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem gerenciar seus likes"
  ON public.forum_likes FOR ALL
  USING (user_id = auth.uid());

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON public.forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON public.forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_status ON public.forum_topics(status);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON public.forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON public.forum_topics(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON public.forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_likes_user ON public.forum_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_topic ON public.forum_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_post ON public.forum_likes(post_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_forum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_forum_categories_updated_at
  BEFORE UPDATE ON public.forum_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_forum_updated_at();

CREATE TRIGGER update_forum_topics_updated_at
  BEFORE UPDATE ON public.forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_forum_updated_at();

CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_forum_updated_at();

-- Trigger para atualizar contadores
CREATE OR REPLACE FUNCTION public.update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_topics 
    SET replies_count = replies_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_id
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_topics 
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_topic_reply_count
  AFTER INSERT OR DELETE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_topic_reply_count();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;

-- Inserir categorias iniciais
INSERT INTO public.forum_categories (name, slug, description, icon, color, position) VALUES
  ('Química Geral', 'quimica-geral', 'Dúvidas sobre química geral e fundamentos', 'Atom', 'blue', 1),
  ('Química Orgânica', 'quimica-organica', 'Discussões sobre química orgânica', 'FlaskConical', 'green', 2),
  ('Físico-Química', 'fisico-quimica', 'Tópicos de físico-química e termodinâmica', 'Zap', 'orange', 3),
  ('Vestibular & ENEM', 'vestibular-enem', 'Preparação para vestibulares e ENEM', 'GraduationCap', 'purple', 4),
  ('Dicas de Estudo', 'dicas-estudo', 'Compartilhe técnicas e dicas de estudo', 'Lightbulb', 'yellow', 5),
  ('Off-Topic', 'off-topic', 'Conversas gerais da comunidade', 'MessageCircle', 'gray', 6)
ON CONFLICT (slug) DO NOTHING;