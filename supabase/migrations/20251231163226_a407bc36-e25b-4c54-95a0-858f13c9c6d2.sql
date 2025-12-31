-- Habilitar Realtime para tabela ai_generated_content (mapas mentais e flashcards IA)
-- Necessário para sincronização em tempo real entre gestão e aluno

-- Primeiro, garantir que a tabela está no modo REPLICA IDENTITY FULL
ALTER TABLE public.ai_generated_content REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_generated_content;