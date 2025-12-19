-- Ajustes de Storage para uploads grandes e qualquer tipo de arquivo
-- Bucket: arquivos
DO $$
BEGIN
  -- Atualiza limites do bucket (se as colunas existirem)
  UPDATE storage.buckets
  SET
    file_size_limit = 2147483648, -- 2GB
    allowed_mime_types = NULL
  WHERE id = 'arquivos';
EXCEPTION WHEN undefined_column THEN
  -- Ambiente sem essas colunas (mantém compatibilidade)
  NULL;
END $$;

-- Políticas RLS para permitir upload autenticado no bucket 'arquivos'
DO $$
BEGIN
  -- INSERT (upload)
  BEGIN
    CREATE POLICY "arquivos_upload_authenticated"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'arquivos');
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- UPDATE (re-upload / move)
  BEGIN
    CREATE POLICY "arquivos_update_authenticated"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'arquivos')
    WITH CHECK (bucket_id = 'arquivos');
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- DELETE
  BEGIN
    CREATE POLICY "arquivos_delete_authenticated"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'arquivos');
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;