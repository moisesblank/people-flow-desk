-- Criar política para leitura pública de overlays de vídeo
CREATE POLICY "Overlays de video sao publicos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'materiais' 
  AND (storage.foldername(name))[1] = 'overlays'
);