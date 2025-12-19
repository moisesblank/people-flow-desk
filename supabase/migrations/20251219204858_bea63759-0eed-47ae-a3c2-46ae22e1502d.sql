-- ===================================================
-- SISTEMA DE ANEXOS UNIVERSAL - TABELA ARQUIVOS
-- Suporte a uploads até 2GB, qualquer formato,
-- organização por data, integração com IA
-- ===================================================

-- Dropar tabela antiga se existir (cuidado em produção!)
-- DROP TABLE IF EXISTS arquivos CASCADE;

-- Recriar tabela com estrutura completa
CREATE TABLE IF NOT EXISTS public.arquivos_universal (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do arquivo
  nome TEXT NOT NULL,                    -- Nome original do arquivo
  nome_storage TEXT NOT NULL,            -- Nome no storage (com timestamp)
  url TEXT NOT NULL,                     -- URL pública do arquivo
  path TEXT NOT NULL,                    -- Caminho completo no storage
  tipo TEXT NOT NULL,                    -- MIME type (image/png, application/pdf, etc.)
  extensao TEXT,                         -- Extensão do arquivo (.pdf, .jpg, etc.)
  tamanho BIGINT NOT NULL,               -- Tamanho em bytes
  
  -- Organização
  bucket TEXT DEFAULT 'arquivos',        -- Nome do bucket
  categoria TEXT DEFAULT 'geral',        -- Categoria do arquivo
  pasta TEXT,                            -- Pasta/módulo de origem
  
  -- Organização por DATA (IMPORTANTE!)
  ano INTEGER NOT NULL,                  -- 2024, 2025, etc.
  mes INTEGER NOT NULL,                  -- 1-12
  semana INTEGER NOT NULL,               -- 1-52
  dia INTEGER NOT NULL,                  -- 1-31
  data_upload TIMESTAMPTZ DEFAULT NOW(), -- Data/hora exata do upload
  
  -- IA
  ia_ler BOOLEAN DEFAULT false,          -- Se a IA deve processar este arquivo
  ia_processado BOOLEAN DEFAULT false,   -- Se já foi processado pela IA
  ia_resultado JSONB,                    -- Resultado do processamento da IA
  
  -- Descrição e tags
  descricao TEXT,                        -- Descrição opcional
  tags TEXT[],                           -- Tags para busca
  
  -- Relacionamentos (todos opcionais)
  usuario_id UUID,                       -- Quem fez upload
  aluno_id UUID,
  funcionario_id UUID,
  afiliado_id INTEGER,
  empresa_id UUID,
  curso_id UUID,
  aula_id UUID,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,            -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_categoria ON public.arquivos_universal(categoria);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_pasta ON public.arquivos_universal(pasta);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_data ON public.arquivos_universal(ano, mes, dia);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_tipo ON public.arquivos_universal(tipo);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_ia_ler ON public.arquivos_universal(ia_ler);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_usuario ON public.arquivos_universal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_nome ON public.arquivos_universal(nome);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_ativo ON public.arquivos_universal(ativo);
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_created ON public.arquivos_universal(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_arquivos_universal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_arquivos_universal_updated_at ON public.arquivos_universal;
CREATE TRIGGER trigger_arquivos_universal_updated_at
BEFORE UPDATE ON public.arquivos_universal
FOR EACH ROW
EXECUTE FUNCTION public.update_arquivos_universal_updated_at();

-- Habilitar RLS
ALTER TABLE public.arquivos_universal ENABLE ROW LEVEL SECURITY;

-- Owner e Admin vêem tudo
CREATE POLICY "Owner full access arquivos_universal" ON public.arquivos_universal
FOR ALL USING (public.is_admin_or_owner(auth.uid()));

-- Usuários autenticados podem ver arquivos ativos
CREATE POLICY "Authenticated read arquivos_universal" ON public.arquivos_universal
FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- Usuários autenticados podem inserir
CREATE POLICY "Authenticated insert arquivos_universal" ON public.arquivos_universal
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Atualizar bucket arquivos para 2GB e qualquer tipo
UPDATE storage.buckets 
SET 
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'arquivos';

-- Garantir políticas do storage para arquivos
DROP POLICY IF EXISTS "Leitura pública arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Upload autenticado arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Update autenticado arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Delete autenticado arquivos" ON storage.objects;

CREATE POLICY "Leitura pública arquivos storage" ON storage.objects
FOR SELECT USING (bucket_id = 'arquivos');

CREATE POLICY "Upload autenticado arquivos storage" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'arquivos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Update autenticado arquivos storage" ON storage.objects
FOR UPDATE USING (bucket_id = 'arquivos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Delete autenticado arquivos storage" ON storage.objects
FOR DELETE USING (bucket_id = 'arquivos' AND auth.uid() IS NOT NULL);