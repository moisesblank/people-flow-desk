
-- ============================================
-- MIGRAÇÃO: Column-Level Security para dados PII (CORRIGIDA)
-- ============================================

-- 1. Criar view segura para affiliates (mascara dados bancários)
CREATE OR REPLACE VIEW public.affiliates_secure AS
SELECT 
  id,
  nome,
  email,
  telefone,
  whatsapp,
  cupom,
  link_afiliado,
  status,
  percentual_comissao,
  taxa_comissao,
  comissao_total,
  total_comissao,
  total_vendas,
  parceiro_aluno,
  hotmart_id,
  user_id,
  created_at,
  -- Dados bancários mascarados (só owner/admin vê completo)
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) THEN pix
    ELSE CONCAT('***', RIGHT(COALESCE(pix, ''), 4))
  END as pix,
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) THEN banco
    ELSE banco
  END as banco,
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) THEN agencia
    ELSE '****'
  END as agencia,
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) THEN conta
    ELSE CONCAT('****-', RIGHT(COALESCE(conta, ''), 1))
  END as conta
FROM public.affiliates;

-- 2. Criar view segura para profiles (mascara CPF) - COLUNAS CORRETAS
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  email,
  nome,
  avatar_url,
  phone,
  bio,
  xp_total,
  level,
  streak_days,
  last_activity_at,
  preferences,
  is_online,
  learning_style,
  churn_risk_score,
  access_expires_at,
  current_focus_area_id,
  study_preferences,
  created_at,
  updated_at,
  last_login_at,
  -- CPF mascarado (só próprio usuário ou owner/admin vê completo)
  CASE 
    WHEN auth.uid() = id OR public.is_admin_or_owner(auth.uid()) THEN cpf
    ELSE CONCAT('***.', SUBSTRING(COALESCE(cpf, ''), 5, 3), '.***-**')
  END as cpf
FROM public.profiles;

-- 3. Criar view segura para alunos (mascara CPF e dados sensíveis) - COLUNAS CORRETAS
CREATE OR REPLACE VIEW public.alunos_secure AS
SELECT 
  id,
  nome,
  email,
  telefone,
  cidade,
  estado,
  status,
  fonte,
  foto_url,
  data_matricula,
  curso_id,
  hotmart_transaction_id,
  valor_pago,
  observacoes,
  created_at,
  updated_at,
  -- CPF mascarado
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) OR public.is_suporte(auth.uid()) THEN cpf
    ELSE CONCAT('***.', SUBSTRING(COALESCE(cpf, ''), 5, 3), '.***-**')
  END as cpf,
  -- Data nascimento
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) OR public.is_suporte(auth.uid()) THEN data_nascimento
    ELSE NULL
  END as data_nascimento
FROM public.alunos;

-- 4. Criar view segura para transacoes_hotmart (mascara CPF do comprador) - COLUNAS CORRETAS
CREATE OR REPLACE VIEW public.transacoes_hotmart_secure AS
SELECT 
  id,
  transaction_id,
  product_id,
  product_name,
  buyer_name,
  buyer_email,
  buyer_phone,
  status,
  valor_bruto,
  valor_liquido,
  metodo_pagamento,
  parcelas,
  affiliate_id,
  affiliate_name,
  comissao_afiliado,
  hotmart_fee,
  motivo_cancelamento,
  data_compra,
  data_confirmacao,
  data_cancelamento,
  webhook_raw,
  created_at,
  updated_at,
  telefone,
  -- CPF mascarado
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) THEN cpf
    ELSE CONCAT('***.', SUBSTRING(COALESCE(cpf::text, ''), 5, 3), '.***-**')
  END as cpf,
  CASE 
    WHEN public.is_admin_or_owner(auth.uid()) THEN buyer_cpf
    ELSE CONCAT('***.', SUBSTRING(COALESCE(buyer_cpf, ''), 5, 3), '.***-**')
  END as buyer_cpf
FROM public.transacoes_hotmart_completo;

-- 5. Garantir RLS nas views
ALTER VIEW public.affiliates_secure SET (security_invoker = on);
ALTER VIEW public.profiles_secure SET (security_invoker = on);
ALTER VIEW public.alunos_secure SET (security_invoker = on);
ALTER VIEW public.transacoes_hotmart_secure SET (security_invoker = on);

-- 6. Criar grants para as views (herdam da tabela base)
GRANT SELECT ON public.affiliates_secure TO authenticated;
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.alunos_secure TO authenticated;
GRANT SELECT ON public.transacoes_hotmart_secure TO authenticated;

-- 7. Criar função de auditoria para acesso a dados sensíveis
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    metadata
  ) VALUES (
    'SENSITIVE_DATA_ACCESS',
    TG_TABLE_NAME,
    NEW.id::text,
    auth.uid(),
    jsonb_build_object(
      'columns_accessed', TG_ARGV[0],
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$;
