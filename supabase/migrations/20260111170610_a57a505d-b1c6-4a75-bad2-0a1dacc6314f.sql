-- Aumentar limite de arquivo do bucket ena-assets-raw para 500 MB
UPDATE storage.buckets 
SET file_size_limit = 524288000  -- 500 MB em bytes
WHERE id = 'ena-assets-raw';

-- Também aumentar o bucket ena-assets-transmuted para consistência
UPDATE storage.buckets 
SET file_size_limit = 524288000  -- 500 MB em bytes
WHERE id = 'ena-assets-transmuted';