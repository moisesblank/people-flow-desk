-- =====================================================
-- FASE 2: ENDURECIMENTO DE POLÍTICAS INSERT
-- Data: 2026-01-22
-- Objetivo: Substituir WITH CHECK(true) por validações explícitas
-- =====================================================

-- ==========================================
-- 1. ADMIN_AUDIT_LOG
-- Contexto: Logs de auditoria admin - sistema pode inserir
-- Nova regra: Apenas usuários autenticados podem criar logs
-- ==========================================

-- Remover políticas inseguras
DROP POLICY IF EXISTS "Service inserts admin_audit_log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_insert_system" ON public.admin_audit_log;

-- Criar política segura
CREATE POLICY "admin_audit_log_insert_authenticated" 
ON public.admin_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- 2. CONTENT_ACCESS_LOG
-- Contexto: Logs de acesso a conteúdo
-- Nova regra: Usuário só pode logar próprio acesso
-- ==========================================

-- Remover política insegura
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.content_access_log;

-- Política user já existe e está correta: content_access_user_insert

-- ==========================================
-- 3. SECURITY_EVENTS
-- Contexto: Eventos de segurança críticos
-- Nova regra: Apenas usuários autenticados, vinculado ao próprio ID
-- ==========================================

-- Remover políticas inseguras
DROP POLICY IF EXISTS "Allow insert for security monitoring" ON public.security_events;
DROP POLICY IF EXISTS "security_events_insert_system" ON public.security_events;

-- Criar política segura
CREATE POLICY "security_events_insert_own" 
ON public.security_events 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. BOOK_ACCESS_LOGS
-- Contexto: Logs de acesso a livros
-- Nova regra: Usuário só pode logar próprio acesso
-- ==========================================

-- Política ALL já existe (book_access_logs_admin)
-- Adicionar política INSERT específica para usuários
CREATE POLICY "book_access_logs_insert_own" 
ON public.book_access_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 5. XP_HISTORY
-- Já está correto: (user_id = auth.uid()) OR is_admin_or_owner(auth.uid())
-- Nenhuma ação necessária
-- ==========================================

-- ==========================================
-- COMENTÁRIO DE AUDITORIA
-- ==========================================
COMMENT ON POLICY "admin_audit_log_insert_authenticated" ON public.admin_audit_log IS 
'FASE2-HARDENING: Substituído WITH CHECK(true) por auth.uid() IS NOT NULL - 2026-01-22';

COMMENT ON POLICY "security_events_insert_own" ON public.security_events IS 
'FASE2-HARDENING: Substituído WITH CHECK(true) por auth.uid() = user_id - 2026-01-22';

COMMENT ON POLICY "book_access_logs_insert_own" ON public.book_access_logs IS 
'FASE2-HARDENING: Adicionada política INSERT com auth.uid() = user_id - 2026-01-22';