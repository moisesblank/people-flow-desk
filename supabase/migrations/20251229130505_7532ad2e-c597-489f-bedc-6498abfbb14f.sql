-- ============================================
-- ONBOARDING OBRIGATÓRIO - PRIMEIRO ACESSO
-- Flag de bloqueio estrutural + campos de etapas
-- ============================================

-- 1. Adicionar campo onboarding_completed (trava-mãe)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 2. Adicionar campo platform_steps_completed (etapa 1: 6 passos)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS platform_steps_completed boolean DEFAULT false;

-- 3. Adicionar campo ui_theme_selected (etapa 2: tema)
-- Será armazenado em preferences.theme, mas este flag indica escolha explícita
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ui_theme_selected boolean DEFAULT false;

-- 4. password_defined já existe (password_change_required = false indica definida)
-- Não precisa criar

-- 5. Adicionar campo trusted_device_registered (etapa 4: dispositivo)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trusted_device_registered boolean DEFAULT false;

-- 6. Adicionar campo onboarding_started_at (para auditoria)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz;

-- 7. Adicionar campo onboarding_completed_at (para auditoria)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- 8. Criar índice para buscas de usuários pendentes de onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_pending 
ON public.profiles (onboarding_completed) 
WHERE onboarding_completed = false;

-- 9. Comentário explicativo
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Flag mãe: true = liberado para usar plataforma, false = bloqueado no primeiro acesso';
COMMENT ON COLUMN public.profiles.platform_steps_completed IS 'Etapa 1: Visualizou os 6 passos da plataforma';
COMMENT ON COLUMN public.profiles.ui_theme_selected IS 'Etapa 2: Escolheu tema (light/dark/system) explicitamente';
COMMENT ON COLUMN public.profiles.trusted_device_registered IS 'Etapa 4: Decidiu sobre confiar ou não no dispositivo';