-- Corrigir função assign_owner_role para usar a constraint única correta em user_roles
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se este for o email do Moisés, garante papel de owner
  IF NEW.email = 'moisesblank@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO UPDATE
      SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$;