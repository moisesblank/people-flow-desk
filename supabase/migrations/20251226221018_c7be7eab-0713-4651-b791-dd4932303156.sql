-- ============================================
-- P0 #3 RETRY: STORAGE POLICIES COM ROLES CORRETAS
-- ============================================

-- AULAS: Corrigir com roles válidas do enum
DROP POLICY IF EXISTS "aulas_select_secure" ON storage.objects;

CREATE POLICY "aulas_select_secure" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'aulas'
  AND (
    public.is_admin_or_owner(auth.uid())
    OR public.has_role(auth.uid(), 'beta'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('employee'::app_role, 'admin'::app_role)
    )
  )
);