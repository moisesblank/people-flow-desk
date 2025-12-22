-- ============================================
-- LIVE CHAT SYSTEM - Tabelas para moderação v2
-- ============================================

-- Tabela para bans e timeouts do chat
CREATE TABLE IF NOT EXISTS public.live_chat_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id),
  is_ban BOOLEAN DEFAULT false,
  timeout_until TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(live_id, user_id)
);

-- Tabela para configurações do chat por live
CREATE TABLE IF NOT EXISTS public.live_chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id TEXT NOT NULL UNIQUE,
  slow_mode BOOLEAN DEFAULT false,
  slow_mode_interval INTEGER DEFAULT 5000,
  chat_enabled BOOLEAN DEFAULT true,
  subscriber_only BOOLEAN DEFAULT false,
  follower_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar campos na tabela live_chat_messages se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'live_chat_messages' AND column_name = 'is_deleted') THEN
    ALTER TABLE public.live_chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'live_chat_messages' AND column_name = 'is_pinned') THEN
    ALTER TABLE public.live_chat_messages ADD COLUMN is_pinned BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'live_chat_messages' AND column_name = 'updated_at') THEN
    ALTER TABLE public.live_chat_messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.live_chat_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_settings ENABLE ROW LEVEL SECURITY;

-- Policies para live_chat_bans (usando apenas roles existentes: owner, admin)
CREATE POLICY "Admins podem gerenciar bans"
  ON public.live_chat_bans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Usuários podem ver seu próprio status de ban"
  ON public.live_chat_bans
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies para live_chat_settings
CREATE POLICY "Admins podem gerenciar configurações"
  ON public.live_chat_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Todos podem ver configurações"
  ON public.live_chat_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_live_chat_bans_live_user ON public.live_chat_bans(live_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_bans_timeout ON public.live_chat_bans(timeout_until) WHERE timeout_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_chat_settings_live ON public.live_chat_settings(live_id);