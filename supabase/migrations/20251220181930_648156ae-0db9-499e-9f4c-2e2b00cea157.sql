-- Atualizar TODOS os buckets para aceitar qualquer tipo de arquivo até 2GB
-- Isso garante que o sistema de arquivos funcione em qualquer lugar

-- Bucket principal de arquivos
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648, -- 2GB
  allowed_mime_types = NULL -- Aceita QUALQUER tipo
WHERE id = 'arquivos';

-- Bucket de documentos
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'documentos';

-- Bucket de comprovantes
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'comprovantes';

-- Bucket de certificados
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'certificados';

-- Bucket de aulas
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'aulas';

-- Bucket de avatars
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'avatars';

-- Bucket de WhatsApp attachments
UPDATE storage.buckets
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'whatsapp-attachments';

-- Adicionar índices para otimização de performance (5000+ usuários)
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_usuario_id ON public.arquivos_universal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_empresa_id ON public.arquivos_universal(empresa_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_created_at ON public.arquivos_universal(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_categoria ON public.arquivos_universal(categoria);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_tipo ON public.arquivos_universal(tipo);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_ano_mes ON public.arquivos_universal(ano, mes);

-- Índices para universal_attachments
CREATE INDEX IF NOT EXISTS idx_universal_attachments_entity ON public.universal_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_universal_attachments_uploaded_by ON public.universal_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_universal_attachments_created_at ON public.universal_attachments(created_at DESC);

-- Adicionar comment de documentação
COMMENT ON TABLE public.arquivos_universal IS 'Central de arquivos empresariais - Aceita qualquer tipo até 2GB - Otimizado para 5000+ usuários';