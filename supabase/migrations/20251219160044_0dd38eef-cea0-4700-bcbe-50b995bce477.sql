-- =============================================
-- PLANILHA VIVA: HABILITAR REALTIME (CORRIGIDO)
-- =============================================

-- Habilitar REPLICA IDENTITY FULL para capturar dados completos
-- Isso não causa erro se já estiver configurado
ALTER TABLE public.entradas REPLICA IDENTITY FULL;
ALTER TABLE public.contas_pagar REPLICA IDENTITY FULL;
ALTER TABLE public.contas_receber REPLICA IDENTITY FULL;
ALTER TABLE public.alunos REPLICA IDENTITY FULL;
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.affiliates REPLICA IDENTITY FULL;
ALTER TABLE public.calendar_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.transacoes_hotmart_completo REPLICA IDENTITY FULL;
ALTER TABLE public.personal_extra_expenses REPLICA IDENTITY FULL;
ALTER TABLE public.company_extra_expenses REPLICA IDENTITY FULL;

-- Adicionar tabelas que ainda não estão na publicação
-- Usar DO block para verificar antes de adicionar
DO $$
BEGIN
  -- contas_pagar
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contas_pagar'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contas_pagar;
  END IF;
  
  -- contas_receber
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contas_receber'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contas_receber;
  END IF;
  
  -- alunos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'alunos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos;
  END IF;
  
  -- employees
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;
  
  -- affiliates
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'affiliates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliates;
  END IF;
  
  -- calendar_tasks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'calendar_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_tasks;
  END IF;
  
  -- transacoes_hotmart_completo
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transacoes_hotmart_completo'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_hotmart_completo;
  END IF;
  
  -- personal_extra_expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'personal_extra_expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_extra_expenses;
  END IF;
  
  -- company_extra_expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'company_extra_expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.company_extra_expenses;
  END IF;
END $$;