
-- ==================================================
-- SECURITY FIX v17.2: Corrigir findings bloqueantes
-- ==================================================

-- 1. video_access_logs: Restringir roles para authenticated only
-- Remover políticas públicas e adicionar restrição
ALTER POLICY "val_insert" ON public.video_access_logs TO authenticated;
ALTER POLICY "val_select" ON public.video_access_logs TO authenticated;
ALTER POLICY "val_user_insert" ON public.video_access_logs TO authenticated;
ALTER POLICY "val_user_select" ON public.video_access_logs TO authenticated;
ALTER POLICY "video_logs_access" ON public.video_access_logs TO authenticated;

-- 2. payment_transactions: Adicionar comentário de validação
COMMENT ON COLUMN public.payment_transactions.metadata IS 
'Metadata campo livre - NÃO armazenar: números de cartão, CVV, senhas, dados bancários completos. 
Permitido: transaction_id, status, parcelas, gateway_reference. 
Validação enforced na Edge Function payment-processor.';

-- 3. Criar política de retenção para video_access_logs (90 dias)
-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_video_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.video_access_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- 4. Criar trigger para auto-limpeza periódica (via cron job externo)
-- Por ora, apenas a função existe para ser chamada via scheduled function

-- 5. Adicionar índice para performance da limpeza
CREATE INDEX IF NOT EXISTS idx_video_access_logs_created_at 
ON public.video_access_logs(created_at);
