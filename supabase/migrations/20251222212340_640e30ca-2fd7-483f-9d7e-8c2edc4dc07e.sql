-- ============================================
-- SANCTUM OMEGA ULTRA - STORAGE BUCKETS
-- Criar buckets para assets protegidos
-- ============================================

-- Bucket para assets originais (upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ena-assets-raw',
  'ena-assets-raw',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600;

-- Bucket para assets transmutados (rasterizados)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ena-assets-transmuted',
  'ena-assets-transmuted',
  false,
  52428800, -- 50MB
  ARRAY['image/webp', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- ============================================
-- POLICIES PARA STORAGE
-- ============================================

-- ena-assets-raw: Apenas owner/admin pode fazer upload
DROP POLICY IF EXISTS "ena_raw_owner_insert" ON storage.objects;
CREATE POLICY "ena_raw_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ena-assets-raw'
    AND (
      auth.email() = 'moisesblank@gmail.com'
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
    )
  );

DROP POLICY IF EXISTS "ena_raw_owner_select" ON storage.objects;
CREATE POLICY "ena_raw_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ena-assets-raw'
    AND (
      auth.email() = 'moisesblank@gmail.com'
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
    )
  );

DROP POLICY IF EXISTS "ena_raw_owner_delete" ON storage.objects;
CREATE POLICY "ena_raw_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'ena-assets-raw'
    AND (
      auth.email() = 'moisesblank@gmail.com'
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
    )
  );

-- ena-assets-transmuted: Owner/admin gerencia, beta/func podem ler via signed URL
DROP POLICY IF EXISTS "ena_transmuted_owner_all" ON storage.objects;
CREATE POLICY "ena_transmuted_owner_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'ena-assets-transmuted'
    AND (
      auth.email() = 'moisesblank@gmail.com'
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('owner', 'admin'))
    )
  );

-- Alunos beta podem ler via edge function (signed URLs)
-- Não precisam de policy direta pois a edge function usa service_role