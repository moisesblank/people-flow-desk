-- ============================================
-- 🧹 REMOÇÃO COMPLETA DO WORDPRESS
-- Constituição v10.x: Limpeza de código legado
-- OWNER: moisesblank@gmail.com
-- ============================================

-- 1. Dropar tabelas de sincronização WordPress
DROP TABLE IF EXISTS public.usuarios_wordpress_sync CASCADE;
DROP TABLE IF EXISTS public.wordpress_events CASCADE;
DROP TABLE IF EXISTS public.wordpress_metrics CASCADE;

-- 2. Dropar tabela de auditoria que dependia do WordPress
DROP TABLE IF EXISTS public.audit_access_mismatches CASCADE;

-- 3. Limpar índices órfãos (se existirem)
DROP INDEX IF EXISTS idx_wp_sync_email;
DROP INDEX IF EXISTS idx_wp_sync_pagamento;
DROP INDEX IF EXISTS idx_wp_sync_wp_id;

-- 4. Comentário de auditoria
COMMENT ON SCHEMA public IS 'WordPress removido em 2025-12-28. Fluxo principal Hotmart->Beta independente.';