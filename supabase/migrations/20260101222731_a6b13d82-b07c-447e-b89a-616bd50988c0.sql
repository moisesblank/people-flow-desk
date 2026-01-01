-- Corrigir search_path nas funções para segurança
CREATE OR REPLACE FUNCTION public.get_log_file_path(p_date timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_month text;
  v_day text;
BEGIN
  v_year := to_char(p_date, 'YYYY');
  v_month := to_char(p_date, 'MM');
  v_day := to_char(p_date, 'DD');
  
  RETURN v_year || '/' || v_month || '/' || v_day || '/logs.txt';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_realtime_logs 
  WHERE created_at < now() - interval '7 days';
END;
$$;