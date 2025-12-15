-- ============================================
-- SISTEMA DE EDIÇÃO INLINE - TIPO ELEMENTOR
-- Armazena todos os conteúdos editáveis do site
-- ============================================

-- Tabela para armazenar conteúdos editáveis
CREATE TABLE IF NOT EXISTS public.editable_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL,
  content_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'text', -- text, html, image, json
  content_value text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(page_key, content_key)
);

-- Índices para performance
CREATE INDEX idx_editable_content_page ON public.editable_content(page_key);
CREATE INDEX idx_editable_content_key ON public.editable_content(content_key);

-- Enable RLS
ALTER TABLE public.editable_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Apenas owner pode editar
CREATE POLICY "Anyone can view editable content"
  ON public.editable_content
  FOR SELECT
  USING (true);

CREATE POLICY "Owner can manage editable content"
  ON public.editable_content
  FOR ALL
  USING (has_role(auth.uid(), 'owner'))
  WITH CHECK (has_role(auth.uid(), 'owner'));

-- Trigger para updated_at
CREATE TRIGGER update_editable_content_updated_at
  BEFORE UPDATE ON public.editable_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir conteúdos padrão da Landing Page
INSERT INTO public.editable_content (page_key, content_key, content_type, content_value, metadata) VALUES
-- Hero Section
('landing', 'hero_badge', 'text', '#1 em Aprovações em Medicina', '{}'),
('landing', 'hero_title_1', 'text', 'O Professor que', '{}'),
('landing', 'hero_title_highlight', 'text', 'Mais Aprova', '{}'),
('landing', 'hero_title_2', 'text', 'em Medicina no Brasil', '{}'),
('landing', 'hero_subtitle', 'text', 'Química de alto nível com metodologia exclusiva. Milhares de alunos aprovados nas melhores faculdades de Medicina do país.', '{}'),
('landing', 'hero_cta_primary', 'text', 'Começar Agora', '{}'),
('landing', 'hero_cta_secondary', 'text', 'Black Friday 2025', '{}'),
('landing', 'hero_stat_1_value', 'text', '12847', '{}'),
('landing', 'hero_stat_1_label', 'text', 'Alunos Ativos', '{}'),
('landing', 'hero_stat_2_value', 'text', '4892', '{}'),
('landing', 'hero_stat_2_label', 'text', 'Aprovados 2024', '{}'),
('landing', 'hero_stat_3_value', 'text', '98', '{}'),
('landing', 'hero_stat_3_label', 'text', 'Satisfação', '{}'),
-- Professor Card
('landing', 'professor_name', 'text', 'Prof. Moisés Medeiros', '{}'),
('landing', 'professor_title', 'text', 'Especialista em Química para Medicina', '{}'),
('landing', 'professor_badge_1', 'text', '+15 anos de experiência', '{}'),
('landing', 'professor_badge_2', 'text', 'Método exclusivo', '{}'),
('landing', 'professor_live', 'text', 'Próxima aula: Quarta 19h', '{}'),
('landing', 'professor_image', 'image', '/professor-moises.jpg', '{"alt": "Professor Moisés Medeiros"}'),
-- Nav
('landing', 'nav_brand', 'text', 'Prof. Moisés', '{}'),
('landing', 'nav_subtitle', 'text', 'Química para Medicina', '{}'),
-- CTA Links
('landing', 'cta_area_aluno', 'text', 'https://app.moisesmedeiros.com.br', '{}'),
('landing', 'cta_black_friday', 'text', 'https://app.moisesmedeiros.com.br/black-friday-2025', '{}'),
-- Dashboard
('dashboard', 'title', 'text', 'Central de Comando', '{}'),
('dashboard', 'subtitle', 'text', 'Visão geral do seu negócio • Tempo real • Integrações ativas', '{}'),
('dashboard', 'brand_label', 'text', 'CURSO - MOISÉS MEDEIROS', '{}'),
('dashboard', 'brand_sublabel', 'text', 'Sistema de Gestão Empresarial', '{}')
ON CONFLICT (page_key, content_key) DO NOTHING;