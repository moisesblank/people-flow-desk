-- ============================================
-- PARTE 10: GENOMA DIVINO - Complementos
-- Tipos e índices adicionais
-- ============================================

-- 10.1 Criar tipos ENUM faltantes (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flashcard_state') THEN
    CREATE TYPE public.flashcard_state AS ENUM ('new', 'learning', 'review', 'relearning');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_difficulty') THEN
    CREATE TYPE public.question_difficulty AS ENUM ('easy', 'medium', 'hard');
  END IF;
END $$;

-- 10.2 Adicionar valores extras ao event_name se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'flashcard.reviewed' AND enumtypid = 'event_name'::regtype) THEN
    ALTER TYPE event_name ADD VALUE IF NOT EXISTS 'flashcard.reviewed';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'churn.risk.high' AND enumtypid = 'event_name'::regtype) THEN
    ALTER TYPE event_name ADD VALUE IF NOT EXISTS 'churn.risk.high';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'study.session.started' AND enumtypid = 'event_name'::regtype) THEN
    ALTER TYPE event_name ADD VALUE IF NOT EXISTS 'study.session.started';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'study.session.ended' AND enumtypid = 'event_name'::regtype) THEN
    ALTER TYPE event_name ADD VALUE IF NOT EXISTS 'study.session.ended';
  END IF;
END $$;

-- 10.3 Índices de performance na tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_churn_risk ON public.profiles(churn_risk_score) 
WHERE churn_risk_score > 0.5;

CREATE INDEX IF NOT EXISTS idx_profiles_access_expires ON public.profiles(access_expires_at) 
WHERE access_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_profiles_level_xp ON public.profiles(level DESC, xp_total DESC);

-- 10.4 Índices de performance na tabela events
CREATE INDEX IF NOT EXISTS idx_events_status_pending ON public.events(created_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_name_created ON public.events(name, created_at DESC);

-- 10.5 Adicionar coluna cpf ao profiles se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'cpf') THEN
    ALTER TABLE public.profiles ADD COLUMN cpf TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf) WHERE cpf IS NOT NULL;
  END IF;
END $$;

-- 10.6 Comentários para documentação
COMMENT ON TABLE public.profiles IS 'Tabela principal de usuários com gamificação e dados de estudo';
COMMENT ON TABLE public.events IS 'Event Sourcing - todos os eventos do sistema para processamento';
COMMENT ON COLUMN public.profiles.churn_risk_score IS 'Score de risco de cancelamento (0-1) calculado por IA';
COMMENT ON COLUMN public.profiles.learning_style IS 'Estilo de aprendizagem detectado: visual, auditivo, cinestésico';
COMMENT ON COLUMN public.profiles.access_expires_at IS 'Data de expiração do acesso beta/premium';