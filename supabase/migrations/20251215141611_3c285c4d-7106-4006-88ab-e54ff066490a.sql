-- Criar tabela employee_documents que está faltando
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'documento',
  categoria TEXT NOT NULL DEFAULT 'outros',
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  tamanho INTEGER,
  mime_type TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Index para busca rápida
CREATE INDEX idx_employee_documents_employee ON public.employee_documents(employee_id);

-- Policies
CREATE POLICY "Admin can manage employee documents"
  ON public.employee_documents FOR ALL TO authenticated
  USING (is_admin_or_owner(auth.uid()))
  WITH CHECK (is_admin_or_owner(auth.uid()));

-- Adicionar colunas que faltam na tabela affiliates
ALTER TABLE public.affiliates 
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS taxa_comissao INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS link_afiliado TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);