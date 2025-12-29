
-- ============================================
-- FIX: Permitir expires_at para QUALQUER role (CONSTITUIÇÃO v10.x)
-- Antes: só beta_expira podia ter expires_at
-- Agora: qualquer role pode ter expires_at (NULL = permanente, DATE = expira)
-- ============================================

-- Atualizar a função de validação
CREATE OR REPLACE FUNCTION public.validate_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 🎯 SYNAPSE Ω v10.x: expires_at é OPCIONAL para QUALQUER role
  -- NULL = acesso permanente
  -- DATE = expira na data especificada
  
  -- Nenhuma validação restritiva - expires_at é universal
  -- A função expire_beta_roles vai converter para aluno_gratuito quando expirar
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log da alteração
INSERT INTO public.audit_logs (action, table_name, metadata)
VALUES (
  'FIX_EXPIRES_AT_VALIDATION',
  'user_roles',
  jsonb_build_object(
    'change', 'Permitir expires_at para qualquer role',
    'reason', 'CONSTITUIÇÃO v10.x - expiração universal',
    'executed_at', NOW()
  )
);
