-- Add new expense categories to the enum
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'feira';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'compras_casa';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'compras_bruna';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'compras_moises';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'cachorro';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'carro';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'gasolina';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'lanches';

-- Create a function to assign owner role on first signup or specific email
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the owner email, assign owner role
  IF NEW.email = 'moisesblank@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign owner role
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_owner_role();