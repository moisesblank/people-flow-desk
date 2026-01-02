-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Enforcement de MACRO NOT NULL na tabela quiz_questions
-- CONSTITUIÇÃO TRANSVERSAL v2.0 — MACRO é identidade obrigatória
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Primeiro, atualizar registros existentes com MACRO nulo para 'quimica_geral' (fallback seguro)
UPDATE public.quiz_questions 
SET macro = 'Química Geral'
WHERE macro IS NULL OR macro = '';

-- 2. Agora aplicar constraint NOT NULL
ALTER TABLE public.quiz_questions 
ALTER COLUMN macro SET NOT NULL;

-- 3. Adicionar constraint CHECK para garantir que MACRO não é vazio
ALTER TABLE public.quiz_questions 
ADD CONSTRAINT quiz_questions_macro_not_empty 
CHECK (macro IS NOT NULL AND macro != '');

-- 4. Comentário explicativo
COMMENT ON COLUMN public.quiz_questions.macro IS 'MACRO é a identidade única e obrigatória da questão. NÃO pode ser nulo ou vazio. Definido pela Constituição Transversal v2.0';