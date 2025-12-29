-- =============================================
-- BLOCO 2: Adicionar campos obrigatórios em user_devices
-- =============================================

-- Adicionar campo revoked_reason se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_devices' AND column_name = 'revoked_reason'
  ) THEN
    ALTER TABLE public.user_devices ADD COLUMN revoked_reason TEXT;
  END IF;
END $$;

-- Renomear deactivated_at para revoked_at (se preferir manter consistência com o BLOCO 2)
-- Mas vamos manter deactivated_at como alias para não quebrar código existente
-- e apenas garantir que revoked_reason exista

-- Criar índice para consultas rápidas por user_id + is_active
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active 
ON public.user_devices(user_id, is_active) 
WHERE is_active = true;

-- Criar índice para consultas por device_fingerprint
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint 
ON public.user_devices(device_fingerprint);

-- Criar constraint unique para evitar duplicatas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_device_fingerprint'
  ) THEN
    ALTER TABLE public.user_devices 
    ADD CONSTRAINT unique_user_device_fingerprint 
    UNIQUE (user_id, device_fingerprint);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;