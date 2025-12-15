-- Criar tabela de auditoria de permissões
CREATE TABLE IF NOT EXISTS public.permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  changed_by UUID NOT NULL,
  changed_by_email TEXT,
  changed_by_name TEXT,
  old_role TEXT,
  new_role TEXT,
  action TEXT NOT NULL, -- 'role_changed', 'role_removed', 'role_assigned'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para owners verem todos os logs
CREATE POLICY "Owners can view permission audit logs"
ON public.permission_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'owner'));

-- Política para inserir logs (qualquer admin/owner pode inserir)
CREATE POLICY "Admins can insert permission audit logs"
ON public.permission_audit_logs
FOR INSERT
WITH CHECK (is_admin_or_owner(auth.uid()));

-- Criar índices para performance
CREATE INDEX idx_permission_audit_logs_user_id ON public.permission_audit_logs(user_id);
CREATE INDEX idx_permission_audit_logs_created_at ON public.permission_audit_logs(created_at DESC);
CREATE INDEX idx_permission_audit_logs_changed_by ON public.permission_audit_logs(changed_by);

-- Comentário na tabela
COMMENT ON TABLE public.permission_audit_logs IS 'Histórico de alterações de permissões de usuários';