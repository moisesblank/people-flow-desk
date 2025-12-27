-- Criar função is_gestao_staff para verificar se é staff com acesso à gestão
-- Inclui todos os roles que têm acesso ao módulo gestaofc
CREATE OR REPLACE FUNCTION public.is_gestao_staff(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN (
      'owner'::app_role,
      'admin'::app_role,
      'employee'::app_role,
      'coordenacao'::app_role,
      'suporte'::app_role,
      'monitoria'::app_role,
      'afiliado'::app_role,
      'marketing'::app_role,
      'contabilidade'::app_role
    )
  )
$$;