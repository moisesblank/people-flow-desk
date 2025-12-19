-- =============================================
-- PARTE 2: ÍNDICES DE PERFORMANCE
-- =============================================

-- Índices para tabela alunos
CREATE INDEX IF NOT EXISTS idx_alunos_status_ativo ON public.alunos(status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_alunos_email ON public.alunos(email);
CREATE INDEX IF NOT EXISTS idx_alunos_created ON public.alunos(created_at DESC);

-- Índices para tabela entradas
CREATE INDEX IF NOT EXISTS idx_entradas_data ON public.entradas(data DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_created ON public.entradas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_categoria ON public.entradas(categoria);

-- Índices para tabela contas_pagar
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_created ON public.contas_pagar(created_at DESC);

-- Índices para tabela webhooks_queue
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_created ON public.webhooks_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_status ON public.webhooks_queue(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_queue_source ON public.webhooks_queue(source);

-- Índices para tabela employees
CREATE INDEX IF NOT EXISTS idx_employees_status_ativo ON public.employees(status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_employees_setor ON public.employees(setor);

-- Índices para tabela transacoes_hotmart_completo
CREATE INDEX IF NOT EXISTS idx_hotmart_status ON public.transacoes_hotmart_completo(status);
CREATE INDEX IF NOT EXISTS idx_hotmart_data ON public.transacoes_hotmart_completo(data_compra DESC);
CREATE INDEX IF NOT EXISTS idx_hotmart_email ON public.transacoes_hotmart_completo(buyer_email);

-- Índices para tabela calendar_tasks
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date ON public.calendar_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_user ON public.calendar_tasks(user_id, task_date);

-- Índices para tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_online ON public.profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =============================================
-- VIEW MATERIALIZADA PARA DASHBOARD
-- =============================================

-- Remover view se existir para recriar
DROP MATERIALIZED VIEW IF EXISTS public.mv_dashboard_stats_v2;

-- Criar view materializada otimizada
CREATE MATERIALIZED VIEW public.mv_dashboard_stats_v2 AS
SELECT 
  (SELECT COUNT(*) FROM public.alunos WHERE status = 'ativo') as alunos_ativos,
  (SELECT COUNT(*) FROM public.employees WHERE status = 'ativo') as funcionarios_ativos,
  (SELECT COUNT(*) FROM public.affiliates WHERE status = 'ativo') as afiliados_ativos,
  (SELECT COALESCE(SUM(valor), 0) FROM public.entradas WHERE created_at >= date_trunc('month', now())) as receita_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM public.contas_pagar WHERE status = 'pago' AND data_pagamento >= date_trunc('month', now())) as despesa_mes,
  (SELECT COUNT(*) FROM public.transacoes_hotmart_completo WHERE status IN ('approved', 'purchase_approved') AND data_compra >= date_trunc('month', now())) as vendas_mes,
  (SELECT COUNT(*) FROM public.calendar_tasks WHERE task_date = CURRENT_DATE AND is_completed = false) as tarefas_hoje,
  (SELECT COUNT(*) FROM public.profiles WHERE is_online = true) as usuarios_online,
  now() as updated_at;

-- Índice único para refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_v2_id ON public.mv_dashboard_stats_v2(updated_at);

-- Função para refresh da view materializada
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_stats_v2;
END;
$$;