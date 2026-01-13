-- ═══════════════════════════════════════════════════════════════════════════
-- FIX P0: Adicionar política UPDATE para question_import_history
-- PROBLEMA: O status nunca é atualizado de 'processing' para 'completed'/'failed'
-- porque não há RLS policy de UPDATE
-- ═══════════════════════════════════════════════════════════════════════════

-- Política de UPDATE: Staff de gestão pode atualizar registros de importação
CREATE POLICY "Staff pode atualizar histórico de importação"
  ON public.question_import_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coordenacao')
    )
  );

-- Política de DELETE: Permitir deleção para limpeza de histórico (aniquilação)
CREATE POLICY "Staff pode deletar histórico de importação"
  ON public.question_import_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

COMMENT ON POLICY "Staff pode atualizar histórico de importação" ON public.question_import_history IS 'FIX P0: Permite atualização do status após processamento';