-- ============================================
-- SISTEMA DE PRESENÇA ONLINE/OFFLINE
-- Tracking a cada 10 minutos
-- ============================================

-- Tabela de presença
CREATE TABLE public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_online boolean DEFAULT true,
  device_type text,
  ip_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index para queries rápidas
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen_at DESC);
CREATE INDEX idx_user_presence_online ON public.user_presence(is_online) WHERE is_online = true;

-- RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver/atualizar apenas seu próprio status
CREATE POLICY "Users can view own presence"
ON public.user_presence FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
ON public.user_presence FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence"
ON public.user_presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Staff pode ver todos
CREATE POLICY "Staff can view all presence"
ON public.user_presence FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao', 'suporte', 'monitoria')
  )
);

-- Função para atualizar presença (upsert)
CREATE OR REPLACE FUNCTION public.update_user_presence(
  p_device_type text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, last_seen_at, is_online, device_type, ip_hash, updated_at)
  VALUES (auth.uid(), now(), true, p_device_type, p_ip_hash, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_seen_at = now(),
    is_online = true,
    device_type = COALESCE(EXCLUDED.device_type, user_presence.device_type),
    ip_hash = COALESCE(EXCLUDED.ip_hash, user_presence.ip_hash),
    updated_at = now();
END;
$$;

-- Função para marcar usuários offline (last_seen > 15 min)
CREATE OR REPLACE FUNCTION public.mark_users_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_presence
  SET is_online = false, updated_at = now()
  WHERE is_online = true
  AND last_seen_at < now() - interval '15 minutes';
END;
$$;

-- View para status de presença dos alunos
CREATE OR REPLACE VIEW public.alunos_presence AS
SELECT 
  a.id as aluno_id,
  a.email,
  p.id as auth_user_id,
  up.is_online,
  up.last_seen_at,
  up.device_type,
  CASE 
    WHEN up.is_online = true AND up.last_seen_at > now() - interval '15 minutes' THEN 'online'
    WHEN up.last_seen_at > now() - interval '1 hour' THEN 'away'
    ELSE 'offline'
  END as presence_status
FROM public.alunos a
LEFT JOIN public.profiles p ON lower(p.email) = lower(a.email)
LEFT JOIN public.user_presence up ON up.user_id = p.id;

-- Grant para a view
GRANT SELECT ON public.alunos_presence TO authenticated;

-- Enable realtime para presença
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;