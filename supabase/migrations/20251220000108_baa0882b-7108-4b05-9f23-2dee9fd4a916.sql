-- =====================================================
-- APERFEIÇOAMENTO DAS TABELAS LMS EXISTENTES
-- Adiciona campos faltantes sem quebrar o existente
-- =====================================================

-- 1. ALUNOS: Adicionar foto se não existir
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- 2. COURSES: Adicionar campos extras
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'online',
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- 3. MODULES: Adicionar status
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 4. LESSONS: Adicionar status e tipo
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'video',
ADD COLUMN IF NOT EXISTS material_url TEXT,
ADD COLUMN IF NOT EXISTS material_nome TEXT;

-- 5. ENROLLMENTS: Adicionar campos de matrícula
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 6. LESSON_PROGRESS: Adicionar campos de controle
ALTER TABLE public.lesson_progress
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS avaliacao INTEGER;

-- 7. CERTIFICATES: Adicionar campos extras
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS nome_aluno TEXT,
ADD COLUMN IF NOT EXISTS nome_curso TEXT,
ADD COLUMN IF NOT EXISTS carga_horaria INTEGER,
ADD COLUMN IF NOT EXISTS validado BOOLEAN DEFAULT true;

-- 8. CRIAR TABELA PAGAMENTOS_CURSOS (específica para cursos)
CREATE TABLE IF NOT EXISTS public.pagamentos_cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  valor_desconto NUMERIC DEFAULT 0,
  valor_final NUMERIC NOT NULL DEFAULT 0,
  cupom_usado TEXT,
  forma_pagamento TEXT DEFAULT 'pix',
  status TEXT DEFAULT 'pendente',
  gateway TEXT DEFAULT 'hotmart',
  transaction_id TEXT,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  parcelas INTEGER DEFAULT 1,
  parcela_atual INTEGER DEFAULT 1,
  comprovante_url TEXT,
  observacoes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_cursos_aluno ON public.pagamentos_cursos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_cursos_curso ON public.pagamentos_cursos(curso_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_cursos_status ON public.pagamentos_cursos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_cursos_data ON public.pagamentos_cursos(data_pagamento);

-- Enable RLS
ALTER TABLE public.pagamentos_cursos ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pagamentos_cursos
CREATE POLICY "Admin gerencia pagamentos_cursos"
  ON public.pagamentos_cursos FOR ALL
  USING (is_admin_or_owner(auth.uid()))
  WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário vê próprios pagamentos_cursos"
  ON public.pagamentos_cursos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos 
      WHERE alunos.id = pagamentos_cursos.aluno_id 
      AND alunos.email = (auth.jwt() ->> 'email')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_pagamentos_cursos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pagamentos_cursos_updated ON public.pagamentos_cursos;
CREATE TRIGGER trigger_pagamentos_cursos_updated
  BEFORE UPDATE ON public.pagamentos_cursos
  FOR EACH ROW EXECUTE FUNCTION update_pagamentos_cursos_updated_at();

-- Enable Realtime para tabelas LMS
ALTER PUBLICATION supabase_realtime ADD TABLE public.pagamentos_cursos;

-- Adicionar índices extras para performance nas tabelas existentes
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_email ON public.alunos(email);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);