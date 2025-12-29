
-- 🔧 FIX CRÍTICO: Habilitar REPLICA IDENTITY FULL para Realtime funcionar com filtros
ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;

-- Comentário explicativo
COMMENT ON TABLE public.active_sessions IS 'Sessões ativas dos usuários. REPLICA IDENTITY FULL habilitado para Realtime instantâneo.';
