-- Registrar auditoria da FASE 2
INSERT INTO public.security_audit_log (action, action_category, table_name, metadata, severity)
VALUES (
  'FASE_2_MFA_ADMIN_IMPLEMENTED',
  'security',
  'url_access_rules',
  jsonb_build_object(
    'fase', 'FASE 2',
    'controle', 'C021',
    'gate', 'V011',
    'descricao', 'MFA obrigatório para rotas administrativas',
    'rotas_protegidas', ARRAY['/gestao/*', '/admin/*', '/financeiro/*', '/funcionarios/*', '/configuracoes/*'],
    'roles_afetados', ARRAY['owner', 'admin', 'coordenacao', 'contabilidade'],
    'funcoes_criadas', ARRAY['admin_requires_mfa', 'check_url_access_with_mfa']
  ),
  'info'
);