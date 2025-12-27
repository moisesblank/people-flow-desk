-- =====================================================
-- CONSTITUIÇÃO ROLES v1.0.0 — Migração Segura
-- Desabilita trigger temporariamente para migração
-- =====================================================

-- FASE 1: Desabilitar trigger de proteção temporariamente
ALTER TABLE public.user_roles DISABLE TRIGGER trigger_protect_privilege_v3;

-- FASE 2: Migrar usuários employee → suporte
UPDATE public.user_roles 
SET role = 'suporte'
WHERE role = 'employee';

-- FASE 3: Reabilitar trigger de proteção
ALTER TABLE public.user_roles ENABLE TRIGGER trigger_protect_privilege_v3;

-- FASE 4: Drop CASCADE e recria função is_gestao_staff
DROP FUNCTION IF EXISTS public.is_gestao_staff(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_gestao_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'afiliado')
  )
$$;

COMMENT ON FUNCTION public.is_gestao_staff(uuid) IS 'CONSTITUIÇÃO ROLES v1.0.0: Verifica se usuário é staff de gestão.';

-- FASE 5: Recriar policies removidas pelo CASCADE
CREATE POLICY emp_select_v19 ON public.employees FOR SELECT USING (public.is_gestao_staff(auth.uid()));
CREATE POLICY emp_insert_v19 ON public.employees FOR INSERT WITH CHECK (public.is_gestao_staff(auth.uid()));
CREATE POLICY emp_update_v19 ON public.employees FOR UPDATE USING (public.is_gestao_staff(auth.uid()));
CREATE POLICY emp_delete_v19 ON public.employees FOR DELETE USING (public.is_gestao_staff(auth.uid()));

CREATE POLICY compensation_select_v20 ON public.employee_compensation FOR SELECT USING (public.is_gestao_staff(auth.uid()));
CREATE POLICY compensation_insert_v20 ON public.employee_compensation FOR INSERT WITH CHECK (public.is_gestao_staff(auth.uid()));
CREATE POLICY compensation_update_v20 ON public.employee_compensation FOR UPDATE USING (public.is_gestao_staff(auth.uid()));
CREATE POLICY compensation_delete_v20 ON public.employee_compensation FOR DELETE USING (public.is_gestao_staff(auth.uid()));