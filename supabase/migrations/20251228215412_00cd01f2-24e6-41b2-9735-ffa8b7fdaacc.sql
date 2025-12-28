
-- ============================================
-- MIGRATION: ENFORCE PASSWORD CHANGE ON FIRST LOGIN
-- ============================================
-- Adiciona coluna para forçar troca de senha em contas criadas via admin
-- ============================================

-- 1. Adicionar coluna password_change_required
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_change_required boolean DEFAULT false;

-- 2. Adicionar coluna password_changed_at (timestamp da última troca)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

-- 3. Adicionar coluna magic_password_created_at (para audit)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS magic_password_created_at timestamptz;

-- 4. Criar índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_password_change_required 
ON public.profiles(password_change_required) 
WHERE password_change_required = true;

-- 5. Retroactive fix: Marcar contas criadas via Acesso Oficial que nunca logaram
-- (Identificadas por fonte 'Acesso Oficial' em alunos e sem last_login_at em profiles)
UPDATE public.profiles p
SET password_change_required = true
WHERE p.last_login_at IS NULL
AND EXISTS (
  SELECT 1 FROM public.alunos a 
  WHERE LOWER(a.email) = LOWER(p.email) 
  AND a.fonte ILIKE '%Acesso Oficial%'
);

-- 6. Função helper para verificar se precisa trocar senha
CREATE OR REPLACE FUNCTION public.needs_password_change(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT password_change_required FROM profiles WHERE id = _user_id),
    false
  )
$$;

-- 7. Função para marcar senha como trocada
CREATE OR REPLACE FUNCTION public.mark_password_changed(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    password_change_required = false,
    password_changed_at = NOW()
  WHERE id = _user_id;
END;
$$;

-- 8. Comentários para documentação
COMMENT ON COLUMN public.profiles.password_change_required IS 'Flag que força troca de senha no primeiro login (contas criadas via admin)';
COMMENT ON COLUMN public.profiles.password_changed_at IS 'Timestamp da última troca de senha';
COMMENT ON COLUMN public.profiles.magic_password_created_at IS 'Timestamp de quando a magic password foi gerada (audit)';
COMMENT ON FUNCTION public.needs_password_change IS 'Verifica se usuário precisa trocar senha no login';
COMMENT ON FUNCTION public.mark_password_changed IS 'Marca senha como trocada após primeira alteração';
