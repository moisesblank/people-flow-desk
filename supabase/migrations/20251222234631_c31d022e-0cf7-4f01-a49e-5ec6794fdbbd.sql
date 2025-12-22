-- ============================================
-- Ω FINAL v2: CORREÇÃO DE search_path
-- Drop e recriação de funções problemáticas
-- ============================================

-- Drop get_user_role primeiro
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Recriar get_user_role com tipo correto
CREATE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email = 'moisesblank@gmail.com' THEN
    RETURN 'owner';
  END IF;
  
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'funcionario' THEN 3
      WHEN 'beta' THEN 4
      ELSE 5
    END
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- Corrigir outras funções com search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Garantir RLS em todas tabelas
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;