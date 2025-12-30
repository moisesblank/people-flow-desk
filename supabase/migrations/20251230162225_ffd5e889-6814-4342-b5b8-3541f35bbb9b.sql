-- ============================================
-- 📚 CONFIGURAÇÃO DE CATEGORIAS DE LIVROS
-- Suporte a 2 imagens: banner (horizontal) + capa (vertical)
-- ============================================

CREATE TABLE IF NOT EXISTS public.web_book_categories (
  id TEXT PRIMARY KEY, -- ID normalizado: quimica-geral, quimica-organica, etc.
  name TEXT NOT NULL,
  color TEXT, -- Cor HSL principal
  gradient_start TEXT, -- Cor inicial do gradiente
  gradient_end TEXT, -- Cor final do gradiente
  
  -- IMAGENS (2 formatos diferentes)
  banner_url TEXT, -- Imagem horizontal para filtros (ex: 300x180)
  cover_url TEXT,  -- Imagem vertical para cards (ex: 512x736)
  
  -- Metadados
  position INTEGER DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.web_book_categories IS 'Configuração das 5 macro-categorias de livros com imagens customizáveis';
COMMENT ON COLUMN public.web_book_categories.banner_url IS 'Imagem horizontal para filtros do topo (aprox. 300x180px)';
COMMENT ON COLUMN public.web_book_categories.cover_url IS 'Imagem vertical para cards de livros (aprox. 512x736px)';

-- Inserir as 5 macro-categorias padrão
INSERT INTO public.web_book_categories (id, name, color, gradient_start, gradient_end, position) VALUES
  ('quimica-geral', 'Química Geral', 'hsl(0, 70%, 50%)', '#dc2626', '#7f1d1d', 1),
  ('quimica-organica', 'Química Orgânica', 'hsl(220, 70%, 30%)', '#1e40af', '#1e3a5f', 2),
  ('fisico-quimica', 'Físico Química', 'hsl(140, 60%, 40%)', '#059669', '#064e3b', 3),
  ('revisao', 'Revisão', 'hsl(190, 80%, 50%)', '#06b6d4', '#0e7490', 4),
  ('previsao', 'Previsão', 'hsl(45, 90%, 50%)', '#eab308', '#d97706', 5)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.web_book_categories ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura pública (para alunos verem), escrita apenas gestão
CREATE POLICY "web_book_categories_read_all" ON public.web_book_categories
  FOR SELECT USING (true);

CREATE POLICY "web_book_categories_write_staff" ON public.web_book_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_web_book_categories_updated_at
  BEFORE UPDATE ON public.web_book_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();