-- Ajustar modelagem de roles para garantir 1 papel por usuário e evitar conflitos de criação de conta

-- 1) Remover constraint de unicidade antiga (user_id, role)
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 2) Garantir apenas um papel por usuário
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 3) Atualizar função assign_owner_role para usar a nova constraint
CREATE OR REPLACE FUNCTION public.assign_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se este for o email do Moisés, garante papel de owner (e sobrescreve qualquer outro papel)
  IF NEW.email = 'moisesblank@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$;