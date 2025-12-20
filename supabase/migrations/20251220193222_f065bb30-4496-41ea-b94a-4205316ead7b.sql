-- Criar bucket para materiais de aula (PDFs, apostilas, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materiais',
  'materiais',
  false,
  52428800, -- 50MB max
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de acesso para materiais
-- Alunos podem ver materiais de cursos em que estão matriculados
CREATE POLICY "Alunos podem ver materiais dos cursos matriculados"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'materiais' 
  AND (
    -- Owner pode ver tudo
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner')
    OR
    -- Admin pode ver tudo
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR
    -- Usuário autenticado pode ver (materiais são para alunos logados)
    auth.role() = 'authenticated'
  )
);

-- Apenas admin/owner podem fazer upload
CREATE POLICY "Admin pode fazer upload de materiais"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materiais'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Apenas admin/owner podem deletar
CREATE POLICY "Admin pode deletar materiais"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materiais'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);