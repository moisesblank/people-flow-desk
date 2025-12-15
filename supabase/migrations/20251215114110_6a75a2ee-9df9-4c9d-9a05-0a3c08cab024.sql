-- Corrigir políticas RLS para exigir autenticação (to authenticated)
-- Isso resolve os avisos de "Anonymous Access Policies"

-- 1. Profiles - ajustar para exigir autenticação
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Owner can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

-- 2. User Roles - ajustar
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Owner can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

-- 3. Notifications - ajustar
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4. User Gamification - ajustar
DROP POLICY IF EXISTS "Usuário vê própria gamificação" ON public.user_gamification;
DROP POLICY IF EXISTS "Gamificação pública para leaderboard" ON public.user_gamification;
DROP POLICY IF EXISTS "Sistema gerencia gamificação" ON public.user_gamification;

CREATE POLICY "Authenticated users can view gamification" ON public.user_gamification
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Sistema gerencia gamificação" ON public.user_gamification
FOR ALL TO authenticated
USING ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid()))
WITH CHECK ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid()));

-- 5. User Badges - ajustar
DROP POLICY IF EXISTS "Usuário vê próprios badges" ON public.user_badges;
DROP POLICY IF EXISTS "Badges são públicos para perfil" ON public.user_badges;

CREATE POLICY "Authenticated users can view badges" ON public.user_badges
FOR SELECT TO authenticated
USING (true);

-- 6. XP History
DROP POLICY IF EXISTS "Usuário vê próprio histórico XP" ON public.xp_history;

CREATE POLICY "User can view own xp history" ON public.xp_history
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 7. Financial Goals - ajustar
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.financial_goals;

CREATE POLICY "Users can manage their own goals" ON public.financial_goals
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Personal expenses - ajustar
DROP POLICY IF EXISTS "Users manage own extra expenses" ON public.personal_extra_expenses;
DROP POLICY IF EXISTS "Users manage own fixed expenses" ON public.personal_fixed_expenses;

CREATE POLICY "Users manage own extra expenses" ON public.personal_extra_expenses
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own fixed expenses" ON public.personal_fixed_expenses
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. Calendar tasks - ajustar
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.calendar_tasks;

CREATE POLICY "Users can manage own tasks" ON public.calendar_tasks
FOR ALL TO authenticated
USING ((user_id = auth.uid()) OR is_admin_or_owner(auth.uid()));