
-- Corrigir o warning de Security Definer View
-- Recriar a view sem SECURITY DEFINER
DROP VIEW IF EXISTS public.v_dashboard_consolidado;

CREATE VIEW public.v_dashboard_consolidado 
WITH (security_invoker = true)
AS
SELECT 
  (SELECT COUNT(*) FROM alunos WHERE status = 'ativo') AS alunos_ativos,
  (SELECT COUNT(*) FROM alunos WHERE status = 'inativo') AS alunos_inativos,
  (SELECT COUNT(*) FROM alunos WHERE created_at >= DATE_TRUNC('month', NOW())) AS novos_alunos_mes,
  (SELECT COUNT(*) FROM employees WHERE status = 'ativo') AS funcionarios_ativos,
  (SELECT COUNT(*) FROM affiliates WHERE status = 'ativo') AS afiliados_ativos,
  (SELECT COALESCE(SUM(valor), 0) FROM entradas 
   WHERE created_at >= DATE_TRUNC('month', NOW())) AS receita_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM company_fixed_expenses 
   WHERE mes = EXTRACT(MONTH FROM NOW()) AND ano = EXTRACT(YEAR FROM NOW())) AS despesas_fixas_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM company_extra_expenses 
   WHERE mes = EXTRACT(MONTH FROM NOW()) AND ano = EXTRACT(YEAR FROM NOW())) AS despesas_extras_mes,
  (SELECT COUNT(*) FROM transacoes_hotmart_completo 
   WHERE status IN ('approved', 'purchase_approved', 'completed')
   AND data_compra >= DATE_TRUNC('month', NOW())) AS vendas_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM comissoes WHERE status = 'pendente') AS comissoes_pendentes,
  (SELECT COALESCE(SUM(valor), 0) FROM comissoes WHERE status = 'pago') AS comissoes_pagas,
  NOW() AS updated_at;
