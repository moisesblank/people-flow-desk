-- ============================================================
-- AJUDA15: VIEWS FINANCEIRAS E MÉTRICAS EM TEMPO REAL
-- ============================================================

-- View para resumo financeiro consolidado
CREATE OR REPLACE VIEW public.resumo_financeiro AS
SELECT
  COALESCE(SUM(valor), 0) AS receitas,
  (SELECT COALESCE(SUM(valor), 0) FROM public.gastos) AS despesas,
  COALESCE(SUM(valor), 0) - (SELECT COALESCE(SUM(valor), 0) FROM public.gastos) AS lucro,
  COUNT(*) AS total_transacoes,
  COALESCE(AVG(valor), 0) AS ticket_medio
FROM public.entradas;

-- View para métricas de alunos
CREATE OR REPLACE VIEW public.metricas_alunos AS
SELECT
  COUNT(*) AS total_alunos,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) AS alunos_ativos,
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) AS alunos_concluidos,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) AS alunos_cancelados,
  COALESCE(AVG(valor_pago), 0) AS ticket_medio,
  COALESCE(SUM(valor_pago), 0) AS receita_total,
  COUNT(CASE WHEN fonte = 'Hotmart' THEN 1 END) AS vindos_hotmart
FROM public.alunos;

-- View para métricas de afiliados
CREATE OR REPLACE VIEW public.metricas_afiliados AS
SELECT
  COUNT(*) AS total_afiliados,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) AS afiliados_ativos,
  COALESCE(SUM(total_vendas), 0) AS vendas_totais,
  COALESCE(SUM(comissao_total), 0) AS comissoes_totais,
  COALESCE(AVG(percentual_comissao), 0) AS percentual_medio
FROM public.affiliates;

-- View para métricas de funcionários
CREATE OR REPLACE VIEW public.metricas_funcionarios AS
SELECT
  COUNT(*) AS total_funcionarios,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) AS funcionarios_ativos,
  COUNT(CASE WHEN status = 'ferias' THEN 1 END) AS funcionarios_ferias,
  COUNT(CASE WHEN status = 'afastado' THEN 1 END) AS funcionarios_afastados,
  COUNT(DISTINCT setor) AS total_setores,
  COALESCE((SELECT SUM(salario) FROM public.employee_compensation), 0) AS folha_mensal
FROM public.employees;

-- View para dashboard executivo consolidado
CREATE OR REPLACE VIEW public.dashboard_executivo AS
SELECT
  (SELECT COALESCE(SUM(valor), 0) FROM public.entradas WHERE data >= DATE_TRUNC('month', CURRENT_DATE)) AS receita_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM public.gastos WHERE data >= DATE_TRUNC('month', CURRENT_DATE)) AS despesa_mes,
  (SELECT COUNT(*) FROM public.alunos WHERE status = 'ativo') AS alunos_ativos,
  (SELECT COUNT(*) FROM public.affiliates WHERE status = 'ativo') AS afiliados_ativos,
  (SELECT COUNT(*) FROM public.employees WHERE status = 'ativo') AS funcionarios_ativos,
  (SELECT COUNT(*) FROM public.calendar_tasks WHERE is_completed = false AND task_date <= CURRENT_DATE) AS tarefas_pendentes,
  (SELECT COUNT(*) FROM public.whatsapp_conversations WHERE status = 'open') AS conversas_abertas;

-- Adicionar coluna total_comissao em affiliates se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliates' AND column_name = 'total_comissao') THEN
    ALTER TABLE public.affiliates ADD COLUMN total_comissao DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Função para atualizar métricas ao inserir aluno
CREATE OR REPLACE FUNCTION public.fn_update_aluno_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log da ação
  INSERT INTO audit_logs (action, table_name, record_id, new_data)
  VALUES ('aluno_created', 'alunos', NEW.id::text, to_jsonb(NEW));
  
  RETURN NEW;
END;
$$;

-- Trigger para logging de novos alunos
DROP TRIGGER IF EXISTS tr_aluno_metrics ON public.alunos;
CREATE TRIGGER tr_aluno_metrics
  AFTER INSERT ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_aluno_metrics();

-- Função para atualizar comissão de afiliado
CREATE OR REPLACE FUNCTION public.fn_update_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar totais do afiliado
  UPDATE public.affiliates
  SET 
    total_vendas = COALESCE(total_vendas, 0) + 1,
    total_comissao = COALESCE(total_comissao, 0) + NEW.valor
  WHERE id = NEW.afiliado_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar comissões
DROP TRIGGER IF EXISTS tr_affiliate_commission ON public.comissoes;
CREATE TRIGGER tr_affiliate_commission
  AFTER INSERT ON public.comissoes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_affiliate_commission();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entradas_data ON public.entradas(data);
CREATE INDEX IF NOT EXISTS idx_entradas_categoria ON public.entradas(categoria);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_fonte ON public.alunos(fonte);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_gastos_data ON public.gastos(data);