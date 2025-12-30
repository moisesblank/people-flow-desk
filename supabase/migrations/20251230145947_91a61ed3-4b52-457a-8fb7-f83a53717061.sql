-- Fix is_funcionario_user: usar roles VÁLIDAS do enum app_role
-- Removido: 'funcionario' (não existe no enum)
-- Conforme Constituição v10.0: Gestão usa roles específicas

CREATE OR REPLACE FUNCTION public.is_funcionario_user(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = COALESCE(p_user_id, auth.uid())
        AND role IN ('owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'afiliado')
    );
END;
$function$;

-- Fix is_video_admin: buscar em user_roles, não em profiles (que não tem coluna role)
CREATE OR REPLACE FUNCTION public.is_video_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao')
  );
END;
$function$;