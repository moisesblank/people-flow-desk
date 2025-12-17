-- Adicionar coluna created_at à tabela enrollments se não existir
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Corrigir RLS na tabela user_mfa_settings
DO $$
BEGIN
  -- Criar política se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_mfa_settings' AND policyname = 'Users can manage own MFA settings'
  ) THEN
    ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage own MFA settings"
    ON public.user_mfa_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Garantir que owner, admin e coordenacao podem acessar general_documents
DROP POLICY IF EXISTS "Allow select for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Allow insert for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Allow update for document managers" ON public.general_documents;
DROP POLICY IF EXISTS "Allow delete for document managers" ON public.general_documents;

CREATE POLICY "Allow select for document managers" 
ON public.general_documents FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'coordenacao')
  )
);

CREATE POLICY "Allow insert for document managers" 
ON public.general_documents FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'coordenacao')
  )
);

CREATE POLICY "Allow update for document managers" 
ON public.general_documents FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'coordenacao')
  )
);

CREATE POLICY "Allow delete for document managers" 
ON public.general_documents FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'coordenacao')
  )
);