-- ============================================
-- 🛡️ DOGMA XI: CONTROLE DE DISPOSITIVOS - PASSO 1
-- Criar função check_is_owner_email primeiro
-- ============================================

-- 1. Função para verificar se é owner
CREATE OR REPLACE FUNCTION public.check_is_owner_email(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_owner_email CONSTANT TEXT := 'moisesblank@gmail.com';
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  RETURN COALESCE(LOWER(v_email) = v_owner_email, false);
END;
$$;

-- 2. Adicionar colunas na user_sessions
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS device_name TEXT,
ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Índice para fingerprint
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint 
ON public.user_sessions(user_id, device_fingerprint) 
WHERE device_fingerprint IS NOT NULL;

-- 4. Criar tabela user_devices
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  os TEXT,
  is_active BOOLEAN DEFAULT true,
  is_trusted BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- 5. RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- 6. Policies
CREATE POLICY "user_devices_select_policy"
ON public.user_devices FOR SELECT
USING (user_id = auth.uid() OR public.check_is_owner_email(auth.uid()));

CREATE POLICY "user_devices_insert_policy"
ON public.user_devices FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_devices_update_policy"
ON public.user_devices FOR UPDATE
USING (user_id = auth.uid() OR public.check_is_owner_email(auth.uid()));

CREATE POLICY "user_devices_delete_policy"
ON public.user_devices FOR DELETE
USING (user_id = auth.uid() OR public.check_is_owner_email(auth.uid()));

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON public.user_devices(user_id, is_active) WHERE is_active = true;