-- P0 FIX: Corrigir função is_sna_admin() que causa "column role does not exist"
-- A função ainda referenciava profiles.role mas a coluna foi movida para user_roles

CREATE OR REPLACE FUNCTION public.is_sna_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- CORRIGIDO: Usar user_roles em vez de profiles.role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao')
  );
END;
$function$;