-- Atualizar função para atribuir role automaticamente para todos os novos usuários
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se for o email do owner, atribui 'owner'
  IF NEW.email = 'moisesblank@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'owner';
  ELSE
    -- Para todos os outros usuários, atribui 'employee' por padrão
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe (caso ainda não exista)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_owner_role();