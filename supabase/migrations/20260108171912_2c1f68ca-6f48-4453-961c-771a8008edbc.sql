
-- Adicionar suporte a YouTube no sistema de capítulos
ALTER TABLE video_chapters 
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

-- Criar índice para buscas por YouTube
CREATE INDEX IF NOT EXISTS idx_video_chapters_youtube_id 
ON video_chapters(youtube_video_id) 
WHERE youtube_video_id IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN video_chapters.youtube_video_id IS 'ID do vídeo do YouTube (ex: dQw4w9WgXcQ)';
