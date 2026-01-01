-- Criar bucket para logs em arquivos TXT
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('system-logs', 'system-logs', false, 10485760, ARRAY['text/plain'])
ON CONFLICT (id) DO NOTHING;

-- RLS para o bucket de logs - apenas owner/admin pode ler
CREATE POLICY "Owner and admin can read logs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'system-logs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Função para inserir log e retornar path do arquivo TXT
CREATE OR REPLACE FUNCTION public.get_log_file_path(p_date timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Otimizar tabela de logs para performance
CREATE INDEX IF NOT EXISTS idx_system_realtime_logs_created 
ON public.system_realtime_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_realtime_logs_severity 
ON public.system_realtime_logs(severity);

-- Função para limpar logs antigos (manter apenas 7 dias no banco, arquivos ficam no storage)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.system_realtime_logs 
  WHERE created_at < now() - interval '7 days';
END;
$$;