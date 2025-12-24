-- ============================================
-- LEI VI: Adicionar user_id em security_events + Realtime
-- ============================================

-- Adicionar coluna user_id se não existir
ALTER TABLE public.security_events 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Criar índice para user_id
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);

-- Habilitar realtime para security_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;

-- ============================================
-- Garantir políticas RLS para security_events
-- ============================================

-- Permitir insert para edge functions (service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_events' 
    AND policyname = 'Allow insert for security monitoring'
  ) THEN
    CREATE POLICY "Allow insert for security monitoring"
      ON public.security_events FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Permitir select para admins e owners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_events' 
    AND policyname = 'Admins can view all security events'
  ) THEN
    CREATE POLICY "Admins can view all security events"
      ON public.security_events FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.user_roles 
          WHERE role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;