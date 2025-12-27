
-- =====================================================
-- CONSTITUIÇÃO SYNAPSE Ω v10.0 — P0-2 OWNER ÚNICO ENFORCEMENT
-- Garante que só existe 1 owner e que é moisesblank@gmail.com
-- =====================================================

-- 1) Índice parcial único: só pode existir 1 row com role='owner'
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_owner_idx
ON public.user_roles (role)
WHERE role = 'owner';

-- 2) Trigger que impede role='owner' em email diferente do OWNER
CREATE OR REPLACE FUNCTION public.enforce_owner_email_singleton()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  IF (NEW.role = 'owner') THEN
    SELECT lower(email) INTO v_email
    FROM auth.users
    WHERE id = NEW.user_id;

    IF v_email IS NULL THEN
      RAISE EXCEPTION 'OWNER_ENFORCEMENT_FAIL: user_id não existe em auth.users';
    END IF;

    IF v_email <> 'moisesblank@gmail.com' THEN
      RAISE EXCEPTION 'OWNER_ENFORCEMENT_FAIL: email % não autorizado para role=owner', v_email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_owner_email_singleton ON public.user_roles;
CREATE TRIGGER trg_enforce_owner_email_singleton
BEFORE INSERT OR UPDATE OF role, user_id ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_owner_email_singleton();

-- 3) Revogar acesso público à trigger function (segurança)
REVOKE ALL ON FUNCTION public.enforce_owner_email_singleton() FROM PUBLIC;

COMMENT ON FUNCTION public.enforce_owner_email_singleton() IS 'CONSTITUIÇÃO SYNAPSE Ω v10.0 — P0-2: Impede criação de segundo owner';
COMMENT ON INDEX user_roles_single_owner_idx IS 'CONSTITUIÇÃO SYNAPSE Ω v10.0 — P0-2: Garante unicidade do owner';
