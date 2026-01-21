-- RETRY PATCH: avoid deadlocks by using ALTER POLICY instead of DROP/CREATE
-- Safety timeouts
SET lock_timeout = '5s';
SET statement_timeout = '30s';

-- user_devices: restrict existing policies to authenticated only
ALTER POLICY "user_devices_select_policy" ON public.user_devices TO authenticated;
ALTER POLICY "user_devices_insert_policy" ON public.user_devices TO authenticated;
ALTER POLICY "user_devices_update_policy" ON public.user_devices TO authenticated;
ALTER POLICY "user_devices_delete_policy" ON public.user_devices TO authenticated;

-- tighten UPDATE policy with explicit WITH CHECK (prevents changing user_id away from self/owner)
ALTER POLICY "user_devices_update_policy" ON public.user_devices
USING ((user_id = auth.uid()) OR is_owner(auth.uid()))
WITH CHECK ((user_id = auth.uid()) OR is_owner(auth.uid()));

-- Fix mutable search_path warning
ALTER FUNCTION public.update_video_chapters_timestamp()
SET search_path = public;