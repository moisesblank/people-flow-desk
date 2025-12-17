-- Tabela de métricas do YouTube
CREATE TABLE IF NOT EXISTS public.youtube_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  channel_id TEXT,
  channel_name TEXT,
  inscritos INTEGER DEFAULT 0,
  visualizacoes_totais BIGINT DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  visualizacoes_recentes INTEGER DEFAULT 0,
  videos_recentes INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vídeos do YouTube
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  channel_id TEXT,
  titulo TEXT,
  publicado_em TIMESTAMP WITH TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de métricas do TikTok
CREATE TABLE IF NOT EXISTS public.tiktok_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  username TEXT,
  seguidores INTEGER DEFAULT 0,
  seguindo INTEGER DEFAULT 0,
  curtidas_totais BIGINT DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  visualizacoes_perfil INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vídeos do TikTok
CREATE TABLE IF NOT EXISTS public.tiktok_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  username TEXT,
  descricao TEXT,
  publicado_em TIMESTAMP WITH TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  compartilhamentos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_youtube_metrics_data ON public.youtube_metrics(data DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel ON public.youtube_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_metrics_data ON public.tiktok_metrics(data DESC);

-- RLS policies (acesso público para leitura, apenas service role para escrita)
ALTER TABLE public.youtube_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_videos ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para usuários autenticados
CREATE POLICY "Allow read youtube_metrics for authenticated" ON public.youtube_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read youtube_videos for authenticated" ON public.youtube_videos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read tiktok_metrics for authenticated" ON public.tiktok_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read tiktok_videos for authenticated" ON public.tiktok_videos
  FOR SELECT USING (auth.role() = 'authenticated');