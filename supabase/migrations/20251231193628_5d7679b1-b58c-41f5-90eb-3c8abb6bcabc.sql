-- Adicionar campos de resolução em vídeo para questões
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS has_video_resolution BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_provider TEXT CHECK (video_provider IN ('youtube', 'panda')),
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Índice para filtrar questões com vídeo
CREATE INDEX IF NOT EXISTS idx_quiz_questions_has_video ON public.quiz_questions(has_video_resolution) WHERE has_video_resolution = true;