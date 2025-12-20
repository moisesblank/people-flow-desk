-- Fix linter WARN 1: set immutable search_path on function update_marketing_leads_updated_at
CREATE OR REPLACE FUNCTION public.update_marketing_leads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix linter WARN 2: materialized view exposed via Data APIs
REVOKE ALL ON TABLE public.mv_dashboard_stats_v2 FROM anon;
REVOKE ALL ON TABLE public.mv_dashboard_stats_v2 FROM authenticated;

-- Keep for service_role (implicit) and owner/admin via SECURITY DEFINER RPCs only
