-- =====================================================
-- P0 SECURITY FIX: pdf-previews bucket policy hardening
-- Removes public read access and restricts to authenticated users with valid roles
-- =====================================================

-- 1. DROP the vulnerable public read policy
DROP POLICY IF EXISTS "pdf_previews_public_read" ON storage.objects;

-- 2. CREATE restrictive policy for authenticated users only
CREATE POLICY "pdf_previews_authenticated_read" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdf-previews'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'admin', 'coordenacao', 'beta', 'aluno_presencial', 'beta_expira', 'aluno_gratuito')
  )
);

-- 3. Ensure authenticated users can upload previews (for admin/gestao operations)
DROP POLICY IF EXISTS "pdf_previews_authenticated_upload" ON storage.objects;
CREATE POLICY "pdf_previews_authenticated_upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdf-previews'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'admin', 'coordenacao')
  )
);

-- 4. Ensure authenticated admins can update previews
DROP POLICY IF EXISTS "pdf_previews_authenticated_update" ON storage.objects;
CREATE POLICY "pdf_previews_authenticated_update" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdf-previews'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'admin', 'coordenacao')
  )
);

-- 5. Ensure authenticated admins can delete previews
DROP POLICY IF EXISTS "pdf_previews_authenticated_delete" ON storage.objects;
CREATE POLICY "pdf_previews_authenticated_delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf-previews'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('owner', 'admin', 'coordenacao')
  )
);