-- ============================================
-- MIGRATION v17.4: CONSOLIDAÇÃO MASSIVA DE POLÍTICAS DUPLICADAS
-- Objetivo: Reduzir ~50 políticas duplicadas para ~12 consolidadas
-- ============================================

-- ========== GENERAL_DOCUMENTS (21 → 4) ==========
DROP POLICY IF EXISTS "Admin can manage general documents" ON public.general_documents;
DROP POLICY IF EXISTS "Allow delete for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Documents deletable by authorized users" ON public.general_documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_delete_owner" ON public.general_documents;
DROP POLICY IF EXISTS "Allow insert for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Documents insertable by authorized users" ON public.general_documents;
DROP POLICY IF EXISTS "docs_insert_admin" ON public.general_documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_insert_secure" ON public.general_documents;
DROP POLICY IF EXISTS "Allow select for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Authenticated can view general documents" ON public.general_documents;
DROP POLICY IF EXISTS "Documents viewable by authorized users" ON public.general_documents;
DROP POLICY IF EXISTS "docs_select_admin" ON public.general_documents;
DROP POLICY IF EXISTS "documents_select_policy" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_select_secure" ON public.general_documents;
DROP POLICY IF EXISTS "Allow update for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Documents updatable by authorized users" ON public.general_documents;
DROP POLICY IF EXISTS "docs_update_admin" ON public.general_documents;
DROP POLICY IF EXISTS "documents_update_policy" ON public.general_documents;
DROP POLICY IF EXISTS "general_documents_update_secure" ON public.general_documents;

CREATE POLICY "docs_select" ON public.general_documents FOR SELECT TO authenticated
USING (uploaded_by = auth.uid() OR can_manage_documents(auth.uid()));

CREATE POLICY "docs_insert" ON public.general_documents FOR INSERT TO authenticated
WITH CHECK (can_manage_documents(auth.uid()));

CREATE POLICY "docs_update" ON public.general_documents FOR UPDATE TO authenticated
USING (can_manage_documents(auth.uid()))
WITH CHECK (can_manage_documents(auth.uid()));

CREATE POLICY "docs_delete" ON public.general_documents FOR DELETE TO authenticated
USING (can_manage_documents(auth.uid()));

-- ========== PROFILES (11 → 4) ==========
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert_own_v17" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_strict" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select_own_v17" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_strict" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update_own_v17" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR is_admin_or_owner(auth.uid()));

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR is_owner(auth.uid()))
WITH CHECK (id = auth.uid() OR is_owner(auth.uid()));

CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated
USING (is_owner(auth.uid()));

-- ========== WHATSAPP_CONVERSATIONS (16 → 4) ==========
DROP POLICY IF EXISTS "Admin can manage whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admin manages whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Only staff can manage whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "WhatsApp conversations editable by admins" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conv_manage" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_all" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_v18" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "v16_wa_conversations_delete" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Service inserts whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "v16_wa_conversations_insert" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Only staff can view whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "WhatsApp conversations viewable by admins" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "v16_wa_conversations_select" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conv_secure" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "v16_wa_conversations_update" ON public.whatsapp_conversations;

CREATE POLICY "wa_conv_select" ON public.whatsapp_conversations FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'suporte'
));

CREATE POLICY "wa_conv_insert" ON public.whatsapp_conversations FOR INSERT TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "wa_conv_update" ON public.whatsapp_conversations FOR UPDATE TO authenticated
USING (is_admin_or_owner(auth.uid()) OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'suporte'
));

CREATE POLICY "wa_conv_delete" ON public.whatsapp_conversations FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));