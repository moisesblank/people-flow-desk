-- =============================================
-- FASE 1: ÍNDICES PARA CONTADORES DO DASHBOARD
-- Otimização para 5.000 usuários simultâneos
-- =============================================

-- Índice para contagem de alunos por status
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);

-- Índice para contagem de funcionários por status
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Índice para contagem de afiliados por status
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

-- Índice para tarefas do calendário (data + completude)
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date_completed ON public.calendar_tasks(task_date, is_completed);

-- Índice para contas a pagar por status
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);

-- Índice para transações Hotmart (status + data)
CREATE INDEX IF NOT EXISTS idx_transacoes_status_data ON public.transacoes_hotmart_completo(status, data_compra);

-- Índice para user_roles por role (usado em contagens de beta/gratuito)
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Índice para whatsapp_leads por data
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_created ON public.whatsapp_leads(created_at);