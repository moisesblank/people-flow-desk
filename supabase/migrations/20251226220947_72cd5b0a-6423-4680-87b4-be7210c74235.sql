-- ============================================
-- P0 #2 RETRY: FORÇAR RECRIAÇÃO notifications INSERT
-- ============================================

-- Dropar TODAS as policies de INSERT em notifications
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'notifications' AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

-- Criar policy correta
CREATE POLICY "notifications_insert_secure" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR public.is_admin_or_owner(auth.uid())
);