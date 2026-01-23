-- Corrigir última política pública restante
DROP POLICY IF EXISTS "Service role pode inserir histórico" ON public.whatsapp_conversation_history;
CREATE POLICY "whatsapp_conversation_history_service_only" ON public.whatsapp_conversation_history
FOR INSERT TO service_role WITH CHECK (true);