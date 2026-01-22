-- ============================================
-- 🔐 FASE 4.1: Privatizar buckets materiais e pdf-previews
-- CONSTITUIÇÃO SYNAPSE Ω v10.4 - Storage Security
-- ============================================

-- Tornar bucket 'materiais' PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'materiais';

-- Tornar bucket 'pdf-previews' PRIVADO
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pdf-previews';

-- ============================================
-- Verificar configuração final
-- ============================================
-- Após esta migração:
-- materiais: public = false (requer signed URLs)
-- pdf-previews: public = false (requer signed URLs)