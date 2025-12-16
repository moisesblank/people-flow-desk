-- Tabela para histórico de conversas do TRAMON
CREATE TABLE public.tramon_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp', 'api')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para comandos/ações executadas pelo TRAMON
CREATE TABLE public.tramon_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES tramon_conversations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_tramon_conversations_user ON tramon_conversations(user_id, created_at DESC);
CREATE INDEX idx_tramon_conversations_session ON tramon_conversations(session_id);
CREATE INDEX idx_tramon_actions_user ON tramon_actions(user_id, created_at DESC);

-- RLS
ALTER TABLE public.tramon_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramon_actions ENABLE ROW LEVEL SECURITY;

-- Políticas - apenas owner/admin podem ver
CREATE POLICY "Owner/Admin can manage conversations"
ON public.tramon_conversations
FOR ALL
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Owner/Admin can manage actions"
ON public.tramon_actions
FOR ALL
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Realtime para conversas
ALTER PUBLICATION supabase_realtime ADD TABLE public.tramon_conversations;