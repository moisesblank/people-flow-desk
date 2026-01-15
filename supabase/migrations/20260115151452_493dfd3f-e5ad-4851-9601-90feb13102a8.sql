-- =============================================
-- TABELA: qrcode_books (5 Books para organizar PDFs)
-- =============================================
CREATE TABLE public.qrcode_books (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir os 5 Books padrão
INSERT INTO public.qrcode_books (name, slug, description, position) VALUES
    ('Book 1', 'book-1', 'Primeiro livro de QR Codes', 1),
    ('Book 2', 'book-2', 'Segundo livro de QR Codes', 2),
    ('Book 3', 'book-3', 'Terceiro livro de QR Codes', 3),
    ('Book 4', 'book-4', 'Quarto livro de QR Codes', 4),
    ('Book 5', 'book-5', 'Quinto livro de QR Codes', 5);

-- =============================================
-- TABELA: qrcode_pdfs (PDFs dentro de cada Book)
-- =============================================
CREATE TABLE public.qrcode_pdfs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.qrcode_books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    pdf_url TEXT NOT NULL,
    thumbnail_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    access_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(book_id, slug)
);

-- =============================================
-- RLS: Books - Owner pode tudo, alunos só leem ativos
-- =============================================
ALTER TABLE public.qrcode_books ENABLE ROW LEVEL SECURITY;

-- Owner pode tudo
CREATE POLICY "Owner can manage qrcode_books"
ON public.qrcode_books
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- Alunos podem ler books ativos (para navegação via link)
CREATE POLICY "Authenticated users can view active books"
ON public.qrcode_books
FOR SELECT
TO authenticated
USING (is_active = true);

-- =============================================
-- RLS: PDFs - Owner pode tudo, alunos só leem ativos
-- =============================================
ALTER TABLE public.qrcode_pdfs ENABLE ROW LEVEL SECURITY;

-- Owner pode tudo
CREATE POLICY "Owner can manage qrcode_pdfs"
ON public.qrcode_pdfs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- Alunos podem ler PDFs ativos (acesso via link direto)
CREATE POLICY "Authenticated users can view active pdfs"
ON public.qrcode_pdfs
FOR SELECT
TO authenticated
USING (is_active = true);

-- =============================================
-- FUNÇÃO: Incrementar contador de acesso
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_qrcode_pdf_access(pdf_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.qrcode_pdfs
    SET access_count = access_count + 1
    WHERE id = pdf_id;
END;
$$;

-- =============================================
-- TRIGGER: Atualizar updated_at
-- =============================================
CREATE TRIGGER update_qrcode_books_updated_at
    BEFORE UPDATE ON public.qrcode_books
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qrcode_pdfs_updated_at
    BEFORE UPDATE ON public.qrcode_pdfs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();