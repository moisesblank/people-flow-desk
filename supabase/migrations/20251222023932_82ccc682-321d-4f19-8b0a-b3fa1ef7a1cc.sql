-- ============================================
-- 🔥 TABELA DE CHAT PARA LIVES - 5K SIMULTÂNEOS
-- Otimizada para alta escala com índices estratégicos
-- ============================================

-- Criar tabela de mensagens de chat de lives
CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT,
  message TEXT NOT NULL,
  is_highlighted BOOLEAN DEFAULT false,
  is_moderator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índice para busca por live_id (principal filtro)
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_id 
  ON public.live_chat_messages(live_id);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created_at 
  ON public.live_chat_messages(created_at DESC);

-- Índice composto para queries frequentes (live + data)
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_created 
  ON public.live_chat_messages(live_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Todos autenticados podem ver mensagens
CREATE POLICY "Usuários autenticados podem ver mensagens de chat"
  ON public.live_chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuários podem inserir suas próprias mensagens
CREATE POLICY "Usuários podem enviar mensagens"
  ON public.live_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Owner pode fazer tudo
CREATE POLICY "Owner tem acesso total ao chat"
  ON public.live_chat_messages
  FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()));

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- Comentários
COMMENT ON TABLE public.live_chat_messages IS 'Mensagens de chat das lives - otimizada para 5K+ simultâneos';
COMMENT ON COLUMN public.live_chat_messages.live_id IS 'ID da live associada';
COMMENT ON COLUMN public.live_chat_messages.is_highlighted IS 'Mensagem destacada pelo professor/moderador';
COMMENT ON COLUMN public.live_chat_messages.is_moderator IS 'Enviada por moderador/professor';