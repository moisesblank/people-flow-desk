
-- ============================================
-- DOCUMENTOS COM EXTRAÇÃO DE CONTEÚDO IA
-- Controle de acesso: Owner/Admin vê tudo, outros só o seu
-- ============================================

-- Adicionar coluna para conteúdo extraído
ALTER TABLE public.general_documents 
ADD COLUMN IF NOT EXISTS extracted_content TEXT,
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS extraction_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extraction_model TEXT;

-- Recriar políticas RLS para general_documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.general_documents;
DROP POLICY IF EXISTS "Admin can view all documents" ON public.general_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.general_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.general_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.general_documents;
DROP POLICY IF EXISTS "Anyone can view documents" ON public.general_documents;
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.general_documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON public.general_documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON public.general_documents;

-- Habilitar RLS
ALTER TABLE public.general_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner/Admin vê tudo, outros só o seu
CREATE POLICY "documents_select_policy" ON public.general_documents
FOR SELECT TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR uploaded_by = auth.uid()
);

-- INSERT: Qualquer autenticado pode inserir (vinculado ao seu ID)
CREATE POLICY "documents_insert_policy" ON public.general_documents
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- UPDATE: Owner/Admin pode atualizar tudo, outros só o seu
CREATE POLICY "documents_update_policy" ON public.general_documents
FOR UPDATE TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR uploaded_by = auth.uid()
);

-- DELETE: Owner/Admin pode deletar tudo, outros só o seu
CREATE POLICY "documents_delete_policy" ON public.general_documents
FOR DELETE TO authenticated
USING (
  public.is_admin_or_owner(auth.uid()) 
  OR uploaded_by = auth.uid()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_general_documents_uploaded_by ON public.general_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_general_documents_extraction_status ON public.general_documents(extraction_status);
