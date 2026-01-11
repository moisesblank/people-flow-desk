-- Habilitar Realtime para tabela alunos (endereços)
ALTER TABLE public.alunos REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'alunos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos;
  END IF;
END $$;