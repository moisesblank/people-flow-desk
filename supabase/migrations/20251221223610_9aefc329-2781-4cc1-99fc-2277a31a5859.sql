-- Security hardening: restrict materialized view API exposure
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname='public') LOOP
    EXECUTE format('REVOKE ALL ON %I.%I FROM anon', r.schemaname, r.matviewname);
    EXECUTE format('REVOKE ALL ON %I.%I FROM authenticated', r.schemaname, r.matviewname);
  END LOOP;
END $$;