-- ============================================
-- 🔧 FIX: Alinhar constraint de severity com valores usados na aplicação
-- Expande o CHECK constraint para aceitar todos os níveis padrão
-- ============================================

-- 1. Remover constraint antigo
ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_severity_check;

-- 2. Adicionar constraint expandido com todos os valores válidos
ALTER TABLE public.security_events ADD CONSTRAINT security_events_severity_check
CHECK (severity = ANY (ARRAY['info'::text, 'low'::text, 'warning'::text, 'warn'::text, 'medium'::text, 'high'::text, 'error'::text, 'critical'::text, 'emergency'::text]));

-- 3. Definir DEFAULT para 'info' para evitar NULL
ALTER TABLE public.security_events ALTER COLUMN severity SET DEFAULT 'info';

-- 4. Atualizar valores inválidos existentes (normalizar 'warn' para 'warning')
UPDATE public.security_events SET severity = 'warning' WHERE severity = 'warn';

-- 5. Log da correção
INSERT INTO public.security_events (event_type, severity, source, description, payload)
VALUES (
  'SCHEMA_ALIGNMENT_FIX',
  'info',
  'migration',
  'Constraint de severity expandido para aceitar todos os níveis padrão',
  jsonb_build_object(
    'allowed_values', ARRAY['info', 'low', 'warning', 'warn', 'medium', 'high', 'error', 'critical', 'emergency'],
    'default_value', 'info',
    'applied_at', NOW()
  )
);