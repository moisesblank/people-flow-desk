-- ============================================
-- MIGRAÇÃO: Consolidar RLS live_chat_messages (11→5)
-- ============================================

-- 1. Remover TODAS as 11 políticas existentes
DROP POLICY IF EXISTS "Owner tem acesso total ao chat" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Usuários autenticados podem ver mensagens de chat" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_delete" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_insert" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_select" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_select" ON public.live_chat_messages;
DROP POLICY IF EXISTS "chat_update" ON public.live_chat_messages;

-- 2. Criar 4 políticas consolidadas + 1 service
-- Lógica: Chat de comunidade - usuários veem mensagens não deletadas,
-- podem enviar se não banidos, admin/owner modera

-- SELECT: Usuários veem mensagens não deletadas (ou próprias/admin vê todas)
CREATE POLICY "chat_select_v17" ON public.live_chat_messages
FOR SELECT TO authenticated
USING (
  is_deleted = false 
  OR user_id = auth.uid() 
  OR is_admin_or_owner(auth.uid())
);

-- INSERT: Usuário pode enviar SE não estiver banido do chat
CREATE POLICY "chat_insert_v17" ON public.live_chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND NOT is_user_banned_from_chat(live_id, auth.uid())
);

-- UPDATE: Admin/Owner podem moderar, autor pode editar própria msg
CREATE POLICY "chat_update_v17" ON public.live_chat_messages
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- DELETE: Autor pode deletar própria, Admin/Owner pode deletar qualquer
CREATE POLICY "chat_delete_v17" ON public.live_chat_messages
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- SERVICE ROLE: Para sistema (notificações, moderação automática)
CREATE POLICY "chat_service_v17" ON public.live_chat_messages
FOR ALL TO service_role
USING (true) WITH CHECK (true);