-- ============================================
-- 🔐 CORREÇÃO FINAL: Endurecer wa_conv_insert
-- Última política com WITH CHECK (true) para authenticated
-- ============================================

-- Remover política insegura
DROP POLICY IF EXISTS "wa_conv_insert" ON public.whatsapp_conversations;

-- Criar política segura (apenas service_role pode inserir diretamente)
CREATE POLICY "wa_conv_insert_service" 
ON public.whatsapp_conversations 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- ============================================
-- RESULTADO: 0 políticas inseguras restantes
-- ============================================