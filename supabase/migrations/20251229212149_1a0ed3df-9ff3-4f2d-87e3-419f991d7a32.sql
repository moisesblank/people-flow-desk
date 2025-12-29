-- =============================================
-- BLOCO 2: FONTE DA VERDADE — SESSÃO ÚNICA GARANTIDA
-- Índice UNIQUE parcial impede 2 sessões ativas por user_id
-- =============================================

-- 1. Limpar sessões duplicadas (manter apenas a mais recente por user_id)
WITH ranked AS (
  SELECT id, user_id, created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.active_sessions
  WHERE status = 'active'
)
UPDATE public.active_sessions
SET status = 'revoked', revoked_at = now(), revoked_reason = 'cleanup_duplicate_sessions'
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Criar índice UNIQUE parcial — impede race conditions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_sessions_single_active
ON public.active_sessions (user_id)
WHERE status = 'active';

-- 3. Comentário para documentação
COMMENT ON INDEX idx_active_sessions_single_active IS 
'BLOCO 2 CONSTITUIÇÃO: Garante no máximo 1 sessão ativa por user_id. Fonte da verdade = banco.';