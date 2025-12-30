-- Fix fn_is_owner: buscar role em user_roles (fonte da verdade), não em profiles
-- Conforme Constituição v10.0: OWNER é único, email canônico: moisesblank@gmail.com

CREATE OR REPLACE FUNCTION public.fn_is_owner()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    LOWER(auth.email()) = 'moisesblank@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
END;
$function$;