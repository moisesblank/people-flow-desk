
-- ============================================
-- CORREÇÃO CRÍTICA: MODO MASTER
-- Adicionar UNIQUE constraint e corrigir is_owner()
-- ============================================

-- 1. Adicionar UNIQUE constraint no content_key para o upsert funcionar
ALTER TABLE public.editable_content 
ADD CONSTRAINT editable_content_content_key_unique UNIQUE (content_key);

-- 2. Atualizar função is_owner para usar tanto jwt() quanto uid()
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  owner_email constant text := 'moisesblank@gmail.com';
BEGIN
  -- Tentar obter email do JWT primeiro
  user_email := auth.jwt() ->> 'email';
  
  -- Se não conseguir do JWT, buscar da tabela auth.users
  IF user_email IS NULL THEN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN user_email = owner_email;
END;
$$;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_editable_content_content_key 
ON public.editable_content(content_key);

CREATE INDEX IF NOT EXISTS idx_editable_content_content_type 
ON public.editable_content(content_type);

-- 4. Adicionar política mais permissiva para o owner (INSERT/UPDATE/DELETE) usando email direto
DROP POLICY IF EXISTS "owner_full_access_editable_content" ON public.editable_content;
CREATE POLICY "owner_full_access_editable_content" ON public.editable_content
FOR ALL
USING (
  (auth.jwt() ->> 'email') = 'moisesblank@gmail.com'
  OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'moisesblank@gmail.com'
  )
)
WITH CHECK (
  (auth.jwt() ->> 'email') = 'moisesblank@gmail.com'
  OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'moisesblank@gmail.com'
  )
);
