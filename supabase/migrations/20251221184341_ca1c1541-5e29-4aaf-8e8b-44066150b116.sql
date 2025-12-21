
-- =====================================================================
-- 🛕 SANTUÁRIO BETA v9.0 - PARTE 1: TIPOS E CAMPOS DO PROFILES
-- =====================================================================

-- Tipo para conteúdo gerado por IA (Cache Divino)
DO $$ BEGIN
    CREATE TYPE public.ai_content_type AS ENUM ('summary', 'flashcards', 'quiz', 'mindmap');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tipo para rating de flashcards (FSRS)
DO $$ BEGIN
    CREATE TYPE public.flashcard_rating AS ENUM ('again', 'hard', 'good', 'easy');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Adicionar campos de IA e controle BETA ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS learning_style TEXT,
ADD COLUMN IF NOT EXISTS churn_risk_score REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_focus_area_id UUID,
ADD COLUMN IF NOT EXISTS study_preferences JSONB DEFAULT '{}';

-- Índice para busca de alunos BETA ativos
CREATE INDEX IF NOT EXISTS idx_profiles_access_expires ON public.profiles(access_expires_at) WHERE access_expires_at IS NOT NULL;
