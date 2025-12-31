-- ============================================
-- VIDEOAULAS: Adicionar campos Panda + YouTube
-- Sincronização em tempo real gestao ↔ alunos
-- ============================================

-- Adicionar colunas de provider de vídeo
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS video_provider TEXT DEFAULT 'panda' CHECK (video_provider IN ('panda', 'youtube', 'vimeo', 'upload')),
ADD COLUMN IF NOT EXISTS panda_video_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lessons_video_provider ON public.lessons(video_provider);
CREATE INDEX IF NOT EXISTS idx_lessons_panda_video_id ON public.lessons(panda_video_id) WHERE panda_video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_youtube_video_id ON public.lessons(youtube_video_id) WHERE youtube_video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON public.lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_module_position ON public.lessons(module_id, position);

-- Habilitar Realtime para sincronização em tempo real
ALTER TABLE public.lessons REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;

-- Comentários para documentação
COMMENT ON COLUMN public.lessons.video_provider IS 'Provider do vídeo: panda, youtube, vimeo, upload';
COMMENT ON COLUMN public.lessons.panda_video_id IS 'ID do vídeo no Panda Video';
COMMENT ON COLUMN public.lessons.youtube_video_id IS 'ID do vídeo no YouTube';
COMMENT ON COLUMN public.lessons.thumbnail_url IS 'URL da thumbnail personalizada';
COMMENT ON COLUMN public.lessons.is_published IS 'Se a aula está publicada e visível para alunos';
COMMENT ON COLUMN public.lessons.views_count IS 'Contador de visualizações';
COMMENT ON COLUMN public.lessons.likes_count IS 'Contador de likes';