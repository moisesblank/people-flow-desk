-- Criar tabela para métricas de redes sociais
CREATE TABLE public.social_media_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(100),
  profile_url TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  subscribers INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  is_auto_fetch BOOLEAN DEFAULT false,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados iniciais para as plataformas
INSERT INTO public.social_media_metrics (platform, username, profile_url, is_auto_fetch) VALUES
  ('instagram', 'moises.profquimica', 'https://www.instagram.com/moises.profquimica/', false),
  ('youtube', 'moises.profquimica', 'https://www.youtube.com/@MoisesMedeiros', true),
  ('facebook', 'moises.profquimica', 'https://www.facebook.com/moisesmedeirosquimica', false),
  ('tiktok', 'moises.profquimica', 'https://www.tiktok.com/@moises.profquimica', false);

-- RLS policies
ALTER TABLE public.social_media_metrics ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar (dados públicos)
CREATE POLICY "social_media_metrics_select" ON public.social_media_metrics
  FOR SELECT USING (true);

-- Apenas owner/admin pode atualizar
CREATE POLICY "social_media_metrics_update" ON public.social_media_metrics
  FOR UPDATE USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "social_media_metrics_insert" ON public.social_media_metrics
  FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_social_media_metrics_updated_at
  BEFORE UPDATE ON public.social_media_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico de métricas para análise de crescimento
CREATE TABLE public.social_media_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_media_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_media_history_select" ON public.social_media_history
  FOR SELECT USING (true);

CREATE POLICY "social_media_history_insert" ON public.social_media_history
  FOR INSERT WITH CHECK (true);