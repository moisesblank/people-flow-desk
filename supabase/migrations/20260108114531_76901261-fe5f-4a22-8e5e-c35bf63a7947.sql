-- FIX: Tornar o bucket 'materiais' público para que as imagens de overlay carreguem
UPDATE storage.buckets 
SET public = true 
WHERE id = 'materiais';