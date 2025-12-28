-- ============================================
-- FIX: Foreign Keys bloqueando exclusão de alunos
-- Alterando para SET NULL para preservar histórico
-- ============================================

-- 1. Corrigir entradas (mantém registro, remove vínculo)
ALTER TABLE public.entradas 
DROP CONSTRAINT IF EXISTS entradas_aluno_id_fkey;

ALTER TABLE public.entradas 
ADD CONSTRAINT entradas_aluno_id_fkey 
FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) 
ON DELETE SET NULL;

-- 2. Corrigir comissoes (mantém registro, remove vínculo)
ALTER TABLE public.comissoes 
DROP CONSTRAINT IF EXISTS comissoes_aluno_id_fkey;

ALTER TABLE public.comissoes 
ADD CONSTRAINT comissoes_aluno_id_fkey 
FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) 
ON DELETE SET NULL;