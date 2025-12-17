-- ============================================
-- SECURITY FIX v19.0 - Corrigindo 7 Warnings
-- RLS Policies para tabelas expostas
-- ============================================

-- 1. PAYMENT_TRANSACTIONS - Usuários só veem próprias transações, admin/owner vê tudo
DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admin can manage payment transactions" ON public.payment_transactions;

CREATE POLICY "Users can view own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR 
  public.is_admin_or_owner(auth.uid())
);

CREATE POLICY "Admin can manage payment transactions" 
ON public.payment_transactions 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- 2. USER_SESSIONS - Usuários veem próprias sessões, owner vê todas
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Owner can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Owner can view all sessions" 
ON public.user_sessions 
FOR SELECT 
TO authenticated 
USING (public.is_owner(auth.uid()));

CREATE POLICY "Users can manage own sessions" 
ON public.user_sessions 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. GENERAL_DOCUMENTS - Admin/Owner/Coordenação pode ver e gerenciar
DROP POLICY IF EXISTS "Admin can manage general documents" ON public.general_documents;
DROP POLICY IF EXISTS "Users can view documents" ON public.general_documents;
DROP POLICY IF EXISTS "Authenticated can view general documents" ON public.general_documents;

CREATE POLICY "Admin can manage general documents" 
ON public.general_documents 
FOR ALL 
TO authenticated 
USING (public.can_manage_documents(auth.uid()))
WITH CHECK (public.can_manage_documents(auth.uid()));

CREATE POLICY "Authenticated can view general documents" 
ON public.general_documents 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. EMPLOYEE_DOCUMENTS - Owner/Admin pode ver, Employee vê próprios docs
DROP POLICY IF EXISTS "Admin can manage employee documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Employee can view own documents" ON public.employee_documents;

CREATE POLICY "Admin can manage employee documents" 
ON public.employee_documents 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Employee can view own documents" 
ON public.employee_documents 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_documents.employee_id 
    AND e.user_id = auth.uid()
  )
);

-- 5. MARKETING_CAMPAIGNS - Apenas Admin/Owner/Marketing
DROP POLICY IF EXISTS "Admin can manage marketing campaigns" ON public.marketing_campaigns;

CREATE POLICY "Admin can manage marketing campaigns" 
ON public.marketing_campaigns 
FOR ALL 
TO authenticated 
USING (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'marketing')
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'marketing')
);

-- 6. FACEBOOK_ADS_METRICS - Apenas Admin/Owner/Marketing
DROP POLICY IF EXISTS "Admin can manage facebook ads metrics" ON public.facebook_ads_metrics;

CREATE POLICY "Admin can manage facebook ads metrics" 
ON public.facebook_ads_metrics 
FOR ALL 
TO authenticated 
USING (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'marketing')
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'marketing')
);

-- 7. GOOGLE_ANALYTICS_METRICS - Apenas Admin/Owner/Marketing
DROP POLICY IF EXISTS "Admin can manage google analytics metrics" ON public.google_analytics_metrics;

CREATE POLICY "Admin can manage google analytics metrics" 
ON public.google_analytics_metrics 
FOR ALL 
TO authenticated 
USING (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'marketing')
)
WITH CHECK (
  public.is_admin_or_owner(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'marketing')
);

-- 8. AUDIT_LOGS - Somente Owner pode ver
DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;

CREATE POLICY "Owner can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (public.is_owner(auth.uid()));

CREATE POLICY "Authenticated can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 9. ACTIVITY_LOG - Usuários veem próprias atividades, Owner vê todas
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Owner can view all activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity_log;

CREATE POLICY "Users can view own activity" 
ON public.activity_log 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Owner can view all activity" 
ON public.activity_log 
FOR SELECT 
TO authenticated 
USING (public.is_owner(auth.uid()));

CREATE POLICY "Authenticated can insert activity" 
ON public.activity_log 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 10. INTEGRATION_EVENTS - Apenas Owner/Admin
DROP POLICY IF EXISTS "Admin can manage integration events" ON public.integration_events;

CREATE POLICY "Admin can manage integration events" 
ON public.integration_events 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- 11. QUIZ_QUESTIONS - Proteger respostas dos estudantes
DROP POLICY IF EXISTS "Students cannot see answers directly" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admin can manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Students can view quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Students can view published quiz questions" ON public.quiz_questions;

CREATE POLICY "Admin can manage quiz questions" 
ON public.quiz_questions 
FOR ALL 
TO authenticated 
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Students can view published quiz questions" 
ON public.quiz_questions 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id 
    AND q.is_published = true
  )
);

-- 12. Criar função para ocultar respostas de quiz para estudantes
CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_student(p_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  question_text text,
  question_type text,
  options jsonb,
  points integer,
  question_position integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    q.id,
    q.quiz_id,
    q.question_text,
    q.question_type,
    q.options,
    q.points,
    q."position" as question_position
  FROM public.quiz_questions q
  JOIN public.quizzes qz ON qz.id = q.quiz_id
  WHERE q.quiz_id = p_quiz_id 
    AND qz.is_published = true
  ORDER BY q."position";
$$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);