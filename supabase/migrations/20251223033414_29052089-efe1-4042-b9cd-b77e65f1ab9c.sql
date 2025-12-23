-- Apenas adicionar settings ao realtime (messages já está)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'live_chat_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_settings;
    END IF;
END $$;

-- Comentários
COMMENT ON TABLE public.live_chat_messages IS 'Mensagens do chat de lives - suporte a 5000+ simultâneos';
COMMENT ON TABLE public.live_chat_bans IS 'Banimentos e timeouts do chat de lives';
COMMENT ON TABLE public.live_chat_settings IS 'Configurações do chat por live';