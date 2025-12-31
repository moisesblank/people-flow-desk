-- Atualizar bucket 'materiais' para aceitar mais MIME types
-- Necessário para imagens SVG e áudio do Anki/flashcards
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Documentos (já existentes)
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  -- Imagens (já existentes + SVG)
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  -- Áudio (para flashcards Anki)
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  -- Fallback genérico para outros formatos
  'application/octet-stream'
]
WHERE id = 'materiais';