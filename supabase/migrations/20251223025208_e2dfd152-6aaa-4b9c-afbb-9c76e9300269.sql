-- ============================================
-- FASE 2: C021 — MFA OBRIGATÓRIO PARA ADMIN
-- Gate V011: Admin só entra com MFA
-- ============================================

-- 1) Inserir regras de URL que exigem MFA para rotas administrativas (gestao.moisesmedeiros.com.br)
INSERT INTO public.url_access_rules (url_pattern, domain, allowed_roles, require_mfa, description, priority)
VALUES 
  ('/gestao', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'professor', 'funcionario'], true, 'Área de gestão exige MFA', 10),
  ('/gestao/*', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'professor', 'funcionario'], true, 'Área de gestão exige MFA', 10),
  ('/admin', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin'], true, 'Área admin exige MFA', 5),
  ('/admin/*', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin'], true, 'Área admin exige MFA', 5),
  ('/financeiro', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin', 'contabilidade'], true, 'Financeiro exige MFA', 5),
  ('/financeiro/*', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin', 'contabilidade'], true, 'Financeiro exige MFA', 5),
  ('/funcionarios', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin', 'coordenacao'], true, 'RH exige MFA', 5),
  ('/funcionarios/*', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin', 'coordenacao'], true, 'RH exige MFA', 5),
  ('/configuracoes', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin'], true, 'Configurações exige MFA', 5),
  ('/configuracoes/*', 'gestao.moisesmedeiros.com.br', ARRAY['owner', 'admin'], true, 'Configurações exige MFA', 5);

-- 2) Criar função para verificar se admin tem MFA ativado
CREATE OR REPLACE FUNCTION public.admin_requires_mfa(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_mfa_enabled BOOLEAN;
  v_admin_roles TEXT[] := ARRAY['owner', 'admin', 'coordenacao', 'contabilidade'];
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_role IS NULL OR NOT (v_role = ANY(v_admin_roles)) THEN
    RETURN FALSE;
  END IF;
  SELECT mfa_enabled INTO v_mfa_enabled FROM public.user_mfa_settings WHERE user_id = p_user_id;
  RETURN COALESCE(v_mfa_enabled, FALSE) = FALSE;
END;
$$;

-- 3) Criar função para verificar acesso a URL com MFA
CREATE OR REPLACE FUNCTION public.check_url_access_with_mfa(
  p_user_id UUID,
  p_url TEXT,
  p_domain TEXT DEFAULT 'gestao.moisesmedeiros.com.br'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_user_role TEXT;
  v_mfa_enabled BOOLEAN;
  v_mfa_verified BOOLEAN;
BEGIN
  SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
  SELECT mfa_enabled INTO v_mfa_enabled FROM public.user_mfa_settings WHERE user_id = p_user_id;
  SELECT mfa_verified INTO v_mfa_verified FROM public.active_sessions 
    WHERE user_id = p_user_id AND status = 'active' AND expires_at > NOW()
    ORDER BY last_activity_at DESC LIMIT 1;
  
  SELECT * INTO v_rule FROM public.url_access_rules
    WHERE domain = p_domain AND is_active = true AND p_url LIKE REPLACE(url_pattern, '*', '%')
    ORDER BY priority ASC, LENGTH(url_pattern) DESC LIMIT 1;
  
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object('allowed', TRUE, 'reason', 'no_rule', 'requires_mfa', FALSE);
  END IF;
  
  IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_rule.allowed_roles)) THEN
    RETURN jsonb_build_object('allowed', FALSE, 'reason', 'role_not_allowed', 'user_role', v_user_role);
  END IF;
  
  IF v_rule.require_mfa THEN
    IF COALESCE(v_mfa_enabled, FALSE) = FALSE THEN
      RETURN jsonb_build_object('allowed', FALSE, 'reason', 'mfa_not_configured', 'requires_mfa', TRUE);
    END IF;
    IF COALESCE(v_mfa_verified, FALSE) = FALSE THEN
      RETURN jsonb_build_object('allowed', FALSE, 'reason', 'mfa_not_verified', 'requires_mfa', TRUE);
    END IF;
  END IF;
  
  RETURN jsonb_build_object('allowed', TRUE, 'reason', 'access_granted');
END;
$$;