-- ============================================
-- 🛡️ LEI III v3.0 - HARDENING ETAPA 2 (FINAL)
-- ============================================

-- 1. Índices de segurança
CREATE INDEX IF NOT EXISTS idx_active_sessions_token_hash ON public.active_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_status ON public.active_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_security_violations_user ON public.security_violations_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_type ON public.security_violations_log(violation_type);

-- 2. Função hash com search_path
CREATE OR REPLACE FUNCTION public.hash_session_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(token || 'LEI_III_SALT_v3', 'sha256'), 'hex');
END;
$$;

-- 3. View segura para affiliates (dados bancários mascarados)
DROP VIEW IF EXISTS public.affiliates_safe;
CREATE VIEW public.affiliates_safe AS
SELECT 
  id, nome, email, telefone, whatsapp, cupom, link_afiliado, status,
  total_vendas, total_comissao, comissao_total, percentual_comissao,
  taxa_comissao, hotmart_id, parceiro_aluno, user_id, created_at,
  CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
    THEN banco ELSE COALESCE(LEFT(banco, 3) || '***', 'OCULTO') END AS banco,
  CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
    THEN agencia ELSE COALESCE(LEFT(agencia, 2) || '**', 'OCULTO') END AS agencia,
  CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
    THEN conta ELSE COALESCE(LEFT(conta, 2) || '****', 'OCULTO') END AS conta,
  CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'moisesblank@gmail.com')
    THEN pix ELSE 'OCULTO' END AS pix
FROM public.affiliates;