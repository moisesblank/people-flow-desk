
-- Corrigir funções com assinaturas específicas
ALTER FUNCTION public.end_video_session_omega(text) SET search_path = public;
ALTER FUNCTION public.end_video_session_omega(uuid, text, integer, integer) SET search_path = public;
ALTER FUNCTION public.register_video_violation_omega(text, text, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.register_video_violation_omega(uuid, text, text, text, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.video_session_heartbeat_omega(text, integer) SET search_path = public;
ALTER FUNCTION public.video_session_heartbeat_omega(uuid, integer, text) SET search_path = public;

-- Comentários
COMMENT ON FUNCTION public.end_video_session_omega(text) IS 'SANCTUM v2: Encerra sessão (token) - search_path corrigido';
COMMENT ON FUNCTION public.end_video_session_omega(uuid, text, integer, integer) IS 'SANCTUM v2: Encerra sessão (uuid) - search_path corrigido';
COMMENT ON FUNCTION public.register_video_violation_omega(text, text, integer, jsonb) IS 'SANCTUM v2: Registra violação (token) - search_path corrigido';
COMMENT ON FUNCTION public.register_video_violation_omega(uuid, text, text, text, integer, jsonb) IS 'SANCTUM v2: Registra violação (uuid) - search_path corrigido';
COMMENT ON FUNCTION public.video_session_heartbeat_omega(text, integer) IS 'SANCTUM v2: Heartbeat (token) - search_path corrigido';
COMMENT ON FUNCTION public.video_session_heartbeat_omega(uuid, integer, text) IS 'SANCTUM v2: Heartbeat (uuid) - search_path corrigido';
