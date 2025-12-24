-- ============================================
-- 🛡️ LEI III v3.0 - HARDENING ETAPA 1
-- ADICIONAR COLUNAS E TABELAS
-- ============================================

-- 1. Adicionar colunas à active_sessions
ALTER TABLE public.active_sessions 
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS ip_hash TEXT,
ADD COLUMN IF NOT EXISTS validation_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_validation_ip TEXT;

-- 2. Tabela de violações de segurança
CREATE TABLE IF NOT EXISTS public.security_violations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource_accessed TEXT,
  policy_violated TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_violations_log ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para security_violations_log
DROP POLICY IF EXISTS "security_violations_read_admin" ON public.security_violations_log;
CREATE POLICY "security_violations_read_admin" ON public.security_violations_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::TEXT IN ('owner', 'admin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
  );

DROP POLICY IF EXISTS "security_violations_insert_service" ON public.security_violations_log;
CREATE POLICY "security_violations_insert_service" ON public.security_violations_log
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "security_violations_insert_auth" ON public.security_violations_log;
CREATE POLICY "security_violations_insert_auth" ON public.security_violations_log
  FOR INSERT TO authenticated
  WITH CHECK (true);