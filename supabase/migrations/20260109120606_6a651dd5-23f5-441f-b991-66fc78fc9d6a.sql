-- Criar tabela para ordenação de subcategorias
CREATE TABLE IF NOT EXISTS public.subcategory_ordering (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  subcategory TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, subcategory)
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_subcategory_ordering_course 
ON public.subcategory_ordering(course_id, position);

-- Enable RLS
ALTER TABLE public.subcategory_ordering ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para gestão
CREATE POLICY "Gestão pode ver ordenação de subcategorias"
ON public.subcategory_ordering FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestão pode gerenciar ordenação de subcategorias"
ON public.subcategory_ordering FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordenacao')
  )
);

-- Comentário
COMMENT ON TABLE public.subcategory_ordering IS 'Tabela para controlar a ordem de exibição das subcategorias dentro de cada curso';