-- =============================================
-- SISTEMA DE CONTROLE OWNER v3 - SIMPLIFICADO
-- =============================================

-- 1. Tabela de configurações de layout do owner
CREATE TABLE IF NOT EXISTS public.owner_layout_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  config_key text NOT NULL,
  config_value jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, config_key)
);

-- 2. Tabela de automações do owner
CREATE TABLE IF NOT EXISTS public.owner_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  trigger_type text NOT NULL,
  trigger_config jsonb DEFAULT '{}',
  actions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_run_at timestamptz,
  run_count int DEFAULT 0
);

-- 3. Tabela de log de comandos TRAMON
CREATE TABLE IF NOT EXISTS public.tramon_command_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  comando text NOT NULL,
  resposta text,
  contexto jsonb DEFAULT '{}',
  sucesso boolean DEFAULT true,
  tempo_execucao_ms int,
  created_at timestamptz DEFAULT now()
);

-- 4. Tabela de conversas TRAMON (se não existir)
CREATE TABLE IF NOT EXISTS public.tramon_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  mensagem_usuario text NOT NULL,
  resposta_tramon text,
  intencao_detectada text,
  acoes_sugeridas jsonb DEFAULT '[]',
  contexto jsonb DEFAULT '{}',
  feedback_usuario text,
  created_at timestamptz DEFAULT now()
);

-- RLS para owner_layout_config
ALTER TABLE public.owner_layout_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage layout config" ON public.owner_layout_config;
CREATE POLICY "Owner can manage layout config" ON public.owner_layout_config
  FOR ALL USING (auth.jwt() ->> 'email' = 'moisesblank@gmail.com');

-- RLS para owner_automations
ALTER TABLE public.owner_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage automations" ON public.owner_automations;
CREATE POLICY "Owner can manage automations" ON public.owner_automations
  FOR ALL USING (auth.jwt() ->> 'email' = 'moisesblank@gmail.com');

-- RLS para tramon_command_log
ALTER TABLE public.tramon_command_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view tramon logs" ON public.tramon_command_log;
CREATE POLICY "Owner can view tramon logs" ON public.tramon_command_log
  FOR ALL USING (auth.jwt() ->> 'email' = 'moisesblank@gmail.com');

-- RLS para tramon_conversations
ALTER TABLE public.tramon_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage tramon conversations" ON public.tramon_conversations;
CREATE POLICY "Owner can manage tramon conversations" ON public.tramon_conversations
  FOR ALL USING (auth.jwt() ->> 'email' = 'moisesblank@gmail.com');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_owner_layout_config_updated_at ON public.owner_layout_config;
CREATE TRIGGER update_owner_layout_config_updated_at
  BEFORE UPDATE ON public.owner_layout_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_owner_automations_updated_at ON public.owner_automations;
CREATE TRIGGER update_owner_automations_updated_at
  BEFORE UPDATE ON public.owner_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_layout_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_automations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tramon_command_log;