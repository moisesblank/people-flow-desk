-- CORREÇÃO: Migrar vídeos com IDs do YouTube para provider correto
-- Padrão YouTube: 11 caracteres alfanuméricos [a-zA-Z0-9_-]
-- Padrão Panda UUID: 8-4-4-4-12 hexadecimal

UPDATE lessons
SET 
  video_provider = 'youtube',
  youtube_video_id = COALESCE(youtube_video_id, panda_video_id)
WHERE 
  video_provider = 'panda'
  AND panda_video_id ~ '^[a-zA-Z0-9_-]{11}$'
  AND panda_video_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';