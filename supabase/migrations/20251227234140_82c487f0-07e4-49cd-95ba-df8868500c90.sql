-- PARTE 13: Habilitar realtime para tabela profiles
-- Isso permite que alterações de nome/dados pessoais sejam sincronizadas em tempo real

-- Adicionar profiles à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Garantir REPLICA IDENTITY FULL para capturar todos os dados nas atualizações
ALTER TABLE public.profiles REPLICA IDENTITY FULL;