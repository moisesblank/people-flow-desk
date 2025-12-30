-- Adicionar campos faltantes em quiz_questions para gestão completa
ALTER TABLE public.quiz_questions 
  ALTER COLUMN quiz_id DROP NOT NULL;

-- Adicionar novos campos se não existirem
DO $$ 
BEGIN
  -- is_active
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'is_active') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'updated_at') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  
  -- banca (origem da questão)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'banca') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN banca text DEFAULT 'propria';
  END IF;
  
  -- ano
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'ano') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN ano integer;
  END IF;
  
  -- tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'tags') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  -- area_id (referência a áreas de estudo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'area_id') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL;
  END IF;
  
  -- lesson_id (referência a aulas)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'lesson_id') THEN
    ALTER TABLE public.quiz_questions ADD COLUMN lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER trigger_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quiz_questions_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_active ON public.quiz_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON public.quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_banca ON public.quiz_questions(banca);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_area_id ON public.quiz_questions(area_id);