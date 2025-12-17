
-- =============================================
-- CORREÇÃO DE SEGURANÇA: universal_attachments
-- Restringir visualização apenas para dono do anexo, 
-- dono da entidade relacionada, ou admins
-- =============================================

-- Remover política de SELECT muito permissiva
DROP POLICY IF EXISTS "Users can view attachments" ON universal_attachments;

-- Criar política mais restritiva de visualização
CREATE POLICY "Users can view own attachments or admin" 
ON universal_attachments 
FOR SELECT 
USING (
  auth.uid() = uploaded_by 
  OR is_admin_or_owner(auth.uid())
);

-- Adicionar comentário de segurança
COMMENT ON TABLE universal_attachments IS 'Anexos universais - RLS restrito ao uploader e admins';
