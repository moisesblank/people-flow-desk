-- Corrigir RLS em event_consumers
ALTER TABLE public.event_consumers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner pode gerenciar consumidores"
  ON public.event_consumers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Sistema pode ler consumidores"
  ON public.event_consumers FOR SELECT
  USING (true);