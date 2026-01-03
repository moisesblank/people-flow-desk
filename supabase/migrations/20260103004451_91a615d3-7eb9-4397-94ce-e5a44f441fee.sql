-- Habilitar Realtime para a tabela question_ai_intervention_logs
-- Policy: Real-Time Question-Level AI Log Policy v1.0

-- Garantir REPLICA IDENTITY FULL para capturar dados completos
ALTER TABLE public.question_ai_intervention_logs REPLICA IDENTITY FULL;

-- Adicionar à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.question_ai_intervention_logs;