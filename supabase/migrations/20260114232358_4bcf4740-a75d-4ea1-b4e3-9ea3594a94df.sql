
-- ============================================
-- P0 FIX: Migrar policies user_devices para is_owner()
-- Elimina check_is_owner_email() (email hardcoded)
-- ============================================

-- 1. DROP policies antigas que usam check_is_owner_email()
DROP POLICY IF EXISTS "user_devices_select_policy" ON public.user_devices;
DROP POLICY IF EXISTS "user_devices_update_policy" ON public.user_devices;
DROP POLICY IF EXISTS "user_devices_delete_policy" ON public.user_devices;

-- 2. RECRIAR policies usando is_owner() (valida por role no banco)
CREATE POLICY "user_devices_select_policy"
ON public.user_devices
FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_owner(auth.uid())
);

CREATE POLICY "user_devices_update_policy"
ON public.user_devices
FOR UPDATE
USING (
  user_id = auth.uid() 
  OR is_owner(auth.uid())
);

CREATE POLICY "user_devices_delete_policy"
ON public.user_devices
FOR DELETE
USING (
  user_id = auth.uid() 
  OR is_owner(auth.uid())
);

-- 3. DEPRECAR função vulnerável (comentário para auditoria)
COMMENT ON FUNCTION public.check_is_owner_email(uuid) IS 
'⚠️ DEPRECATED v11.2 - NÃO USAR. Email hardcoded. Use is_owner() que valida por user_roles.role';
