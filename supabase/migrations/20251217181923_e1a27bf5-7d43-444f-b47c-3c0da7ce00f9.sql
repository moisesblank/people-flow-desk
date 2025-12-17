-- =============================================
-- CORREÇÃO DE SEGURANÇA: Analytics + Tabela TRAMON
-- =============================================

-- 1. CORRIGIR política de analytics (adicionar validação)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Validated analytics insert" ON public.analytics_metrics;

CREATE POLICY "Validated analytics insert" 
ON public.analytics_metrics 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
  metric_type IN ('pageview', 'event', 'error', 'click', 'scroll') AND
  page_path IS NOT NULL AND
  length(page_path) < 500 AND
  (visitor_id IS NULL OR length(visitor_id) < 100)
);

-- 2. CRIAR tabela de conversas TRAMON (se não existir)
CREATE TABLE IF NOT EXISTS public.tramon_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'web',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tramon_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own conversations" ON public.tramon_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.tramon_conversations;
DROP POLICY IF EXISTS "Admin can view all conversations" ON public.tramon_conversations;

CREATE POLICY "Users can view own conversations" 
ON public.tramon_conversations FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can insert own conversations" 
ON public.tramon_conversations FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all conversations" 
ON public.tramon_conversations FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid()));

-- 3. CRIAR tabela de logs TRAMON
CREATE TABLE IF NOT EXISTS public.tramon_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  comando TEXT,
  tipo TEXT DEFAULT 'texto',
  acao TEXT,
  entidade TEXT,
  resultado TEXT,
  tempo_processamento INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tramon_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage tramon logs" ON public.tramon_logs;
CREATE POLICY "Admin can manage tramon logs" 
ON public.tramon_logs FOR ALL 
TO authenticated 
USING (is_admin_or_owner(auth.uid()));

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_tramon_conversations_user ON public.tramon_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_tramon_conversations_created ON public.tramon_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tramon_logs_user ON public.tramon_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tramon_logs_created ON public.tramon_logs(created_at DESC);