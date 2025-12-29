-- 🧱 COMPLEMENTO 1: AJUSTES system_guard

-- 1. Criar unique index singleton (garantir apenas 1 linha)
CREATE UNIQUE INDEX IF NOT EXISTS system_guard_singleton
ON public.system_guard ((true));

-- 2. Atualizar RLS para permitir OWNER E ADMIN alterarem
DROP POLICY IF EXISTS "system_guard_update_owner_only" ON public.system_guard;

CREATE POLICY "system_guard_update_owner_or_admin"
ON public.system_guard
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- 3. Adicionar coluna updated_by se não existe
ALTER TABLE public.system_guard
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- 4. Trigger para atualizar updated_at e updated_by automaticamente
CREATE OR REPLACE FUNCTION public.update_system_guard_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_system_guard_audit ON public.system_guard;
CREATE TRIGGER trigger_system_guard_audit
  BEFORE UPDATE ON public.system_guard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_guard_audit();