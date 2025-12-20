-- ============================================
-- HABILITAR REALTIME PARA TABELAS DE ARQUIVOS
-- Sistema de 5000+ usuários simultâneos
-- ============================================

-- Habilitar REPLICA IDENTITY FULL para realtime completo
ALTER TABLE public.arquivos_universal REPLICA IDENTITY FULL;
ALTER TABLE public.universal_attachments REPLICA IDENTITY FULL;

-- Adicionar tabelas ao publication de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.arquivos_universal;
ALTER PUBLICATION supabase_realtime ADD TABLE public.universal_attachments;

-- Índices otimizados para alta concorrência (5000+ usuários)
CREATE INDEX IF NOT EXISTS idx_arquivos_universal_ano_mes 
ON public.arquivos_universal(ano, mes);

CREATE INDEX IF NOT EXISTS idx_arquivos_universal_categoria 
ON public.arquivos_universal(categoria);

CREATE INDEX IF NOT EXISTS idx_arquivos_universal_empresa_id 
ON public.arquivos_universal(empresa_id);

CREATE INDEX IF NOT EXISTS idx_arquivos_universal_created_at 
ON public.arquivos_universal(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_arquivos_universal_ia_processado 
ON public.arquivos_universal(ia_processado) 
WHERE ia_processado = false AND ia_ler = true;

CREATE INDEX IF NOT EXISTS idx_universal_attachments_entity 
ON public.universal_attachments(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_universal_attachments_created 
ON public.universal_attachments(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_universal_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_universal_attachments_updated_at_trigger ON public.universal_attachments;
CREATE TRIGGER update_universal_attachments_updated_at_trigger
  BEFORE UPDATE ON public.universal_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_universal_attachments_updated_at();

-- Política de DELETE para arquivos_universal (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'arquivos_universal' 
    AND policyname = 'Users can delete own arquivos_universal'
  ) THEN
    CREATE POLICY "Users can delete own arquivos_universal"
    ON public.arquivos_universal
    FOR DELETE
    USING (
      auth.uid() = usuario_id::uuid 
      OR public.is_owner(auth.uid())
    );
  END IF;
END $$;

-- Política de UPDATE para arquivos_universal (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'arquivos_universal' 
    AND policyname = 'Users can update own arquivos_universal'
  ) THEN
    CREATE POLICY "Users can update own arquivos_universal"
    ON public.arquivos_universal
    FOR UPDATE
    USING (
      auth.uid() = usuario_id::uuid 
      OR public.is_owner(auth.uid())
    );
  END IF;
END $$;