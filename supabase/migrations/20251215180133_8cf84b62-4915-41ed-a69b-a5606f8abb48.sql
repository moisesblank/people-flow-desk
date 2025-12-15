-- Habilitar RLS na tabela affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Remover política pública de leitura se existir
DROP POLICY IF EXISTS "Anyone can view affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Public read access for affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.affiliates;

-- Criar política para que apenas usuários autenticados possam ver afiliados
CREATE POLICY "Authenticated users can view affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (true);

-- Criar política para que apenas admins/owners possam modificar
CREATE POLICY "Only admins can insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Only admins can update affiliates"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Only admins can delete affiliates"
ON public.affiliates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);