-- Criar tabela de documentos gerais (anexos)
CREATE TABLE IF NOT EXISTS public.general_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size integer,
    category text DEFAULT 'geral',
    tags text[],
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.general_documents ENABLE ROW LEVEL SECURITY;

-- Função para verificar acesso a documentos (owner, admin, coordenacao)
CREATE OR REPLACE FUNCTION public.can_manage_documents(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin', 'coordenacao')
  )
$$;

-- RLS Policies
CREATE POLICY "Documents viewable by authorized users"
ON public.general_documents
FOR SELECT
USING (can_manage_documents(auth.uid()));

CREATE POLICY "Documents insertable by authorized users"
ON public.general_documents
FOR INSERT
WITH CHECK (can_manage_documents(auth.uid()));

CREATE POLICY "Documents updatable by authorized users"
ON public.general_documents
FOR UPDATE
USING (can_manage_documents(auth.uid()));

CREATE POLICY "Documents deletable by authorized users"
ON public.general_documents
FOR DELETE
USING (can_manage_documents(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_general_documents_updated_at
BEFORE UPDATE ON public.general_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();