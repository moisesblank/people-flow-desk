-- 🔒 DATABASE_IS_THE_LAW_SINGLE_SESSION
-- Required artifact (same semantics, canonical name requested).
-- NOTE: migrations run in a transaction; Postgres does NOT allow CREATE INDEX CONCURRENTLY inside a transaction.
-- Physical enforcement is still guaranteed by UNIQUE partial index.

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_session_single_per_user
ON public.active_sessions (user_id)
WHERE (status = 'active'::session_status);

COMMENT ON INDEX public.idx_active_session_single_per_user IS
'DB-enforced single active session per user (status=active).';