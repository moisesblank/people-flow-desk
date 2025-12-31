-- Habilitar Realtime para tabela study_flashcards
-- Sincronização em tempo real entre gestão e aluno

-- Garantir REPLICA IDENTITY FULL para capturar dados completos
ALTER TABLE public.study_flashcards REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_flashcards;