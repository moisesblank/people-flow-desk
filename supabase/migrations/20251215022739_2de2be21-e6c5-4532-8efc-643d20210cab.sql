-- Fase 2: Melhorar políticas RLS de profiles
-- Remover política antiga que era muito ampla

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Criar política específica para usuário ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Criar política específica para admin ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin_or_owner(auth.uid()));

-- Adicionar índice para melhorar performance das consultas de roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Adicionar constraint unique para evitar roles duplicadas
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_unique_user_role UNIQUE (user_id, role);