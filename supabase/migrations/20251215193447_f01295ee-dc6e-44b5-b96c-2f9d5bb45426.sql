-- Fix RLS for activity_log (prevent public exposure + spoofed inserts)
DROP POLICY IF EXISTS "activity_insert_only" ON public.activity_log;
DROP POLICY IF EXISTS "owner_read_activity" ON public.activity_log;

CREATE POLICY "Users can insert their own activity logs"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own activity logs"
ON public.activity_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

-- Optional: Only owner can delete activity logs
CREATE POLICY "Owner can delete activity logs"
ON public.activity_log
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));


-- Fix RLS for affiliates (restrict to owner/admin; remove any public-role policy)
DROP POLICY IF EXISTS "Owner only delete affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Owner only insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Owner only manages affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Owner only update affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Owner only view affiliates" ON public.affiliates;

CREATE POLICY "Admins can view affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update affiliates"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete affiliates"
ON public.affiliates
FOR DELETE
TO authenticated
USING (public.is_admin_or_owner(auth.uid()));
