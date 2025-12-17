-- ============================================================
-- CORREÇÃO SEGURANÇA: VIEWS COM SECURITY INVOKER
-- ============================================================

-- Recriar views com security_invoker = true (seguras)
DROP VIEW IF EXISTS public.resumo_financeiro;
DROP VIEW IF EXISTS public.metricas_alunos;
DROP VIEW IF EXISTS public.metricas_afiliados;
DROP VIEW IF EXISTS public.metricas_funcionarios;
DROP VIEW IF EXISTS public.dashboard_executivo;

-- View para resumo financeiro consolidado (SECURITY INVOKER)
CREATE VIEW public.resumo_financeiro 
WITH (security_invoker = true) AS
SELECT
  COALESCE(SUM(valor), 0) AS receitas,
  (SELECT COALESCE(SUM(valor), 0) FROM public.gastos) AS despesas,
  COALESCE(SUM(valor), 0) - (SELECT COALESCE(SUM(valor), 0) FROM public.gastos) AS lucro,
  COUNT(*) AS total_transacoes,
  COALESCE(AVG(valor), 0) AS ticket_medio
FROM public.entradas;

-- View para métricas de alunos (SECURITY INVOKER)
CREATE VIEW public.metricas_alunos 
WITH (security_invoker = true) AS
SELECT
  COUNT(*) AS total_alunos,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) AS alunos_ativos,
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) AS alunos_concluidos,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) AS alunos_cancelados,
  COALESCE(AVG(valor_pago), 0) AS ticket_medio,
  COALESCE(SUM(valor_pago), 0) AS receita_total,
  COUNT(CASE WHEN fonte = 'Hotmart' THEN 1 END) AS vindos_hotmart
FROM public.alunos;

-- View para métricas de afiliados (SECURITY INVOKER)
CREATE VIEW public.metricas_afiliados 
WITH (security_invoker = true) AS
SELECT
  COUNT(*) AS total_afiliados,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) AS afiliados_ativos,
  COALESCE(SUM(total_vendas), 0) AS vendas_totais,
  COALESCE(SUM(comissao_total), 0) AS comissoes_totais,
  COALESCE(AVG(percentual_comissao), 0) AS percentual_medio
FROM public.affiliates;

-- View para métricas de funcionários (SECURITY INVOKER)
CREATE VIEW public.metricas_funcionarios 
WITH (security_invoker = true) AS
SELECT
  COUNT(*) AS total_funcionarios,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) AS funcionarios_ativos,
  COUNT(CASE WHEN status = 'ferias' THEN 1 END) AS funcionarios_ferias,
  COUNT(CASE WHEN status = 'afastado' THEN 1 END) AS funcionarios_afastados,
  COUNT(DISTINCT setor) AS total_setores,
  COALESCE((SELECT SUM(salario) FROM public.employee_compensation), 0) AS folha_mensal
FROM public.employees;

-- View para dashboard executivo consolidado (SECURITY INVOKER)
CREATE VIEW public.dashboard_executivo 
WITH (security_invoker = true) AS
SELECT
  (SELECT COALESCE(SUM(valor), 0) FROM public.entradas WHERE data >= DATE_TRUNC('month', CURRENT_DATE)) AS receita_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM public.gastos WHERE data >= DATE_TRUNC('month', CURRENT_DATE)) AS despesa_mes,
  (SELECT COUNT(*) FROM public.alunos WHERE status = 'ativo') AS alunos_ativos,
  (SELECT COUNT(*) FROM public.affiliates WHERE status = 'ativo') AS afiliados_ativos,
  (SELECT COUNT(*) FROM public.employees WHERE status = 'ativo') AS funcionarios_ativos,
  (SELECT COUNT(*) FROM public.calendar_tasks WHERE is_completed = false AND task_date <= CURRENT_DATE) AS tarefas_pendentes,
  (SELECT COUNT(*) FROM public.whatsapp_conversations WHERE status = 'open') AS conversas_abertas;