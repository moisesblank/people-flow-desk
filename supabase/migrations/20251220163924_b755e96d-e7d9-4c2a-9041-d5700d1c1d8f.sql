-- Criar tabela de empresas (CNPJ) para referenciar arquivos empresariais por UUID
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresas_updated_at'
  ) THEN
    CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- (Opcional) FK para garantir integridade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema='public'
      AND table_name='arquivos_universal'
      AND constraint_name='arquivos_universal_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.arquivos_universal
      ADD CONSTRAINT arquivos_universal_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas: somente usuários autenticados podem ler; somente owner/admin pode escrever
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='empresas' AND policyname='Empresas view authenticated'
  ) THEN
    CREATE POLICY "Empresas view authenticated"
    ON public.empresas
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='empresas' AND policyname='Empresas write owner/admin'
  ) THEN
    CREATE POLICY "Empresas write owner/admin"
    ON public.empresas
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_owner(auth.uid()) OR public.is_owner(auth.uid()))
    WITH CHECK (public.is_admin_or_owner(auth.uid()) OR public.is_owner(auth.uid()));
  END IF;
END $$;

-- Seed / upsert das 2 empresas
INSERT INTO public.empresas (nome, cnpj, ativo)
VALUES
  ('MMM CURSO DE QUÍMICA LTDA', '53.829.761/0001-17', true),
  ('CURSO QUÍMICA MOISÉS MEDEIROS', '44.979.308/0001-04', true)
ON CONFLICT (cnpj) DO UPDATE
SET nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    updated_at = now();
