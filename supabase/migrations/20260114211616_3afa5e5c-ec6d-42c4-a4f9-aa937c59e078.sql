-- Adicionar coluna source para distinguir Modo Treino vs Modo Prova
ALTER TABLE public.question_attempts 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'modo_treino';

-- Adicionar índice para filtros por source
CREATE INDEX IF NOT EXISTS idx_question_attempts_source ON public.question_attempts(source);

-- Comentário para documentação
COMMENT ON COLUMN public.question_attempts.source IS 'Fonte da tentativa: modo_treino (padrão) ou modo_prova';