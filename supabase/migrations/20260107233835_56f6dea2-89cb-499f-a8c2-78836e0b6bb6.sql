-- Corrigir schema: adicionar colunas de segurança à tabela video_play_sessions
ALTER TABLE public.video_play_sessions
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;