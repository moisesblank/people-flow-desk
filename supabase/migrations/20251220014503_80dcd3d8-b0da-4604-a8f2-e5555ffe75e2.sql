-- =============================================
-- YOUTUBE LIVE INTEGRATION - ATUALIZAÇÃO
-- =============================================

-- Adicionar colunas que faltam na tabela youtube_videos
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS duracao TEXT;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS live_status TEXT;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS concurrent_viewers INTEGER DEFAULT 0;

-- Tabela para lives agendadas/em andamento
CREATE TABLE IF NOT EXISTS public.youtube_lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'upcoming',
  scheduled_start TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  max_viewers INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  curso_id UUID REFERENCES public.courses(id),
  aula_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para chat das lives
CREATE TABLE IF NOT EXISTS public.youtube_live_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID REFERENCES public.youtube_lives(id) ON DELETE CASCADE,
  video_id TEXT,
  author_name TEXT,
  author_channel_id TEXT,
  message TEXT,
  is_owner BOOLEAN DEFAULT FALSE,
  is_moderator BOOLEAN DEFAULT FALSE,
  is_member BOOLEAN DEFAULT FALSE,
  super_chat_amount DECIMAL(10,2),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para presença dos alunos nas lives
CREATE TABLE IF NOT EXISTS public.youtube_live_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID REFERENCES public.youtube_lives(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  watch_time_minutes INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(live_id, aluno_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_youtube_videos_live_status ON public.youtube_videos(live_status);
CREATE INDEX IF NOT EXISTS idx_youtube_lives_status ON public.youtube_lives(status);
CREATE INDEX IF NOT EXISTS idx_youtube_lives_scheduled ON public.youtube_lives(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_youtube_live_chat_live_id ON public.youtube_live_chat(live_id);
CREATE INDEX IF NOT EXISTS idx_youtube_live_attendance_live_id ON public.youtube_live_attendance(live_id);

-- Enable RLS
ALTER TABLE public.youtube_lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_live_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_live_attendance ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "YouTube lives são públicos" ON public.youtube_lives FOR SELECT USING (true);
CREATE POLICY "YouTube chat é público" ON public.youtube_live_chat FOR SELECT USING (true);
CREATE POLICY "Presença é pública" ON public.youtube_live_attendance FOR SELECT USING (true);
CREATE POLICY "Service pode gerenciar lives" ON public.youtube_lives FOR ALL USING (true);
CREATE POLICY "Service pode gerenciar chat" ON public.youtube_live_chat FOR ALL USING (true);
CREATE POLICY "Service pode gerenciar attendance" ON public.youtube_live_attendance FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.youtube_lives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.youtube_live_chat;