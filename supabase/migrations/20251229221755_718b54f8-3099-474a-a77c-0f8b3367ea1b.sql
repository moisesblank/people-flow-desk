-- 🔒 SESSION_BINDING_ENFORCEMENT
-- Enable Realtime for active_sessions so frontend can react INSTANTLY to revocations

ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;

COMMENT ON TABLE public.active_sessions IS 
'Sessions with Realtime enabled for instant revocation detection.';