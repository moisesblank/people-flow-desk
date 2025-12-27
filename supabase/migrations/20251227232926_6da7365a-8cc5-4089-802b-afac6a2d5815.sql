-- ============================================
-- PARTE 10 COMPLEMENTO: Colunas de endereço completo em alunos
-- CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
-- ============================================

-- Adicionar colunas de endereço que faltam
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.alunos.logradouro IS 'Logradouro (rua, avenida, etc.)';
COMMENT ON COLUMN public.alunos.numero IS 'Número do endereço';
COMMENT ON COLUMN public.alunos.complemento IS 'Complemento (apto, bloco, etc.)';
COMMENT ON COLUMN public.alunos.bairro IS 'Bairro';
COMMENT ON COLUMN public.alunos.cep IS 'CEP (apenas números)';