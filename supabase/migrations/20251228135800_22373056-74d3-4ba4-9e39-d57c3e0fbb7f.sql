
-- ============================================
-- P0 FIX: Permitir que OWNER + ADMIN criem roles
-- Constituição v10.x: Admin pode criar roles (exceto owner)
-- ============================================

-- Dropar policies existentes
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

-- Policy de INSERT: Owner pode tudo, Admin pode criar (exceto owner)
CREATE POLICY "user_roles_insert" ON public.user_roles
FOR INSERT
WITH CHECK (
  is_owner(auth.uid()) 
  OR (
    is_admin(auth.uid()) 
    AND role != 'owner'::app_role
  )
);

-- Policy de UPDATE: Owner pode tudo, Admin pode atualizar (exceto owner)
CREATE POLICY "user_roles_update" ON public.user_roles
FOR UPDATE
USING (
  is_owner(auth.uid()) 
  OR (
    is_admin(auth.uid()) 
    AND role != 'owner'::app_role
  )
)
WITH CHECK (
  is_owner(auth.uid()) 
  OR (
    is_admin(auth.uid()) 
    AND role != 'owner'::app_role
  )
);

-- Policy de DELETE: Owner pode tudo, Admin pode deletar (exceto owner)
CREATE POLICY "user_roles_delete" ON public.user_roles
FOR DELETE
USING (
  is_owner(auth.uid()) 
  OR (
    is_admin(auth.uid()) 
    AND role != 'owner'::app_role
  )
);

-- Comentário explicativo
COMMENT ON POLICY "user_roles_insert" ON public.user_roles IS 
'Owner pode criar qualquer role. Admin pode criar roles exceto owner.';
