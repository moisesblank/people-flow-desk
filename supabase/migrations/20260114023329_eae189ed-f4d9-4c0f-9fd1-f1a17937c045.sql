-- Fix: weeks created for Cronograma Fevereiro must be visible in /alunos/planejamento
-- Student portal currently filters planning_weeks by status='active'.
-- Existing auto-created weeks were inserted as 'draft', so only Semana 1 appeared.

UPDATE public.planning_weeks
SET status = 'active',
    updated_at = now()
WHERE status = 'draft'
  AND (
    lower(title) LIKE '%fevereiro%'
    OR lower(title) LIKE '%extensivo fev%'
  );