-- ============================================
-- DOGMA IV: A PROFECIA DAS QUERIES SUB-50MS
-- Índices compostos para performance máxima
-- ============================================

-- ÍNDICES PARA TABELA alunos (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_alunos_status_created 
ON public.alunos(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alunos_email_status 
ON public.alunos(email, status);

CREATE INDEX IF NOT EXISTS idx_alunos_curso_status 
ON public.alunos(curso_id, status);

-- ÍNDICES PARA TABELA employees (queries de listagem)
CREATE INDEX IF NOT EXISTS idx_employees_status_created 
ON public.employees(status, created_at DESC);

-- ÍNDICES PARA TABELA affiliates
CREATE INDEX IF NOT EXISTS idx_affiliates_status_created 
ON public.affiliates(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliates_hotmart_status 
ON public.affiliates(hotmart_id, status);

-- ÍNDICES PARA TABELA transacoes_hotmart_completo (alta frequência)
CREATE INDEX IF NOT EXISTS idx_transacoes_status_data 
ON public.transacoes_hotmart_completo(status, data_compra DESC);

CREATE INDEX IF NOT EXISTS idx_transacoes_buyer_status 
ON public.transacoes_hotmart_completo(buyer_email, status);

CREATE INDEX IF NOT EXISTS idx_transacoes_product_status 
ON public.transacoes_hotmart_completo(product_id, status);

-- ÍNDICES PARA TABELA entradas (financeiro)
CREATE INDEX IF NOT EXISTS idx_entradas_data_categoria 
ON public.entradas(created_at DESC, categoria);

CREATE INDEX IF NOT EXISTS idx_entradas_fonte_data 
ON public.entradas(fonte, created_at DESC);

-- ÍNDICES PARA TABELA calendar_tasks (dashboard)
CREATE INDEX IF NOT EXISTS idx_tasks_user_date_completed 
ON public.calendar_tasks(user_id, task_date, is_completed);

CREATE INDEX IF NOT EXISTS idx_tasks_date_completed 
ON public.calendar_tasks(task_date, is_completed);

-- ÍNDICES PARA TABELA contas_pagar
CREATE INDEX IF NOT EXISTS idx_contas_status_vencimento 
ON public.contas_pagar(status, data_vencimento);

-- ÍNDICES PARA TABELA comissoes
CREATE INDEX IF NOT EXISTS idx_comissoes_afiliado_status 
ON public.comissoes(afiliado_id, status);

CREATE INDEX IF NOT EXISTS idx_comissoes_data_status 
ON public.comissoes(data DESC, status);

-- ÍNDICES PARA TABELA profiles (sessões)
CREATE INDEX IF NOT EXISTS idx_profiles_online_activity 
ON public.profiles(is_online, last_activity_at DESC);

-- ÍNDICES PARA TABELA user_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_active 
ON public.user_sessions(user_id, is_active, login_at DESC);

-- ÍNDICES PARA TABELA activity_log (auditoria)
CREATE INDEX IF NOT EXISTS idx_activity_user_action_date 
ON public.activity_log(user_id, action, created_at DESC);

-- ÍNDICES PARA TABELA universal_attachments
CREATE INDEX IF NOT EXISTS idx_attachments_entity_type 
ON public.universal_attachments(entity_type, entity_id);

-- ÍNDICES PARA analytics_metrics
CREATE INDEX IF NOT EXISTS idx_analytics_type_date 
ON public.analytics_metrics(metric_type, created_at DESC);

-- Comentário para documentação
COMMENT ON INDEX idx_alunos_status_created IS 'DOGMA IV: Índice composto para listagem de alunos por status';
COMMENT ON INDEX idx_transacoes_status_data IS 'DOGMA IV: Índice composto para queries de transações por status e data';