-- ============================================
-- ADICIONAR COLUNA POSITION À TABELA WEB_BOOKS
-- Para ordenação customizada dos livros
-- ============================================

-- 1) Adicionar coluna position
ALTER TABLE public.web_books 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 999;

-- 2) Criar índice para ordenação eficiente
CREATE INDEX IF NOT EXISTS idx_web_books_position ON public.web_books(position ASC);

-- 3) Atualizar posições conforme solicitado:
-- TABELA PERIÓDICA PT 2 (era 05) → posição 1
-- QUIMICA ORGANICA (era 04) → posição 2
-- Físico-Química - Beta (era 02) → posição 3
-- Química Geral - Tramon (era 01) → posição 4
-- Química Orgânica - Gama (era 03) → posição 5

UPDATE public.web_books SET position = 1 WHERE id = '99697aec-8e81-429f-af35-9fe61cf1ae1c'; -- TABELA PERIÓDICA PT 2
UPDATE public.web_books SET position = 2 WHERE id = '51985147-9323-4e23-887e-5cc88f1e6901'; -- QUIMICA ORGANICA
UPDATE public.web_books SET position = 3 WHERE id = '019b2d4b-ad35-40b2-9f0b-43ee18588d96'; -- Físico-Química - Beta
UPDATE public.web_books SET position = 4 WHERE id = '683cc2da-cd9e-4d4b-9dce-245a77700b54'; -- Química Geral - Tramon
UPDATE public.web_books SET position = 5 WHERE id = 'b9c18210-c5bb-486b-b967-2331abd4af31'; -- Química Orgânica - Gama

-- 4) Atualizar função fn_list_books_for_category para usar position
CREATE OR REPLACE FUNCTION public.fn_list_books_for_category(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- Verificar se é owner
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'owner'
  ) INTO v_is_owner;

  SELECT jsonb_agg(subquery) INTO v_result
  FROM (
    SELECT 
      b.id,
      b.title,
      b.subtitle,
      b.category,
      b.status,
      b.total_pages,
      b.is_published,
      b.created_at,
      b.description,
      b.position,
      COALESCE(
        (SELECT jsonb_agg(json_build_object('id', p.id, 'page_number', p.page_number))
         FROM public.web_book_pages p WHERE p.book_id = b.id),
        '[]'::jsonb
      ) as pages_summary
    FROM public.web_books b
    WHERE (b.status = 'ready' OR v_is_owner) 
      AND (COALESCE(b.is_published, false) = true OR v_is_owner)
      AND (p_category IS NULL OR b.category::text = p_category)
      AND (p_search IS NULL OR b.title ILIKE '%' || p_search || '%' OR b.description ILIKE '%' || p_search || '%')
    ORDER BY b.position ASC, b.created_at DESC 
    LIMIT p_limit OFFSET p_offset
  ) AS subquery;
  
  RETURN jsonb_build_object(
    'success', true, 
    'data', COALESCE(v_result, '[]'::jsonb),
    'is_owner', v_is_owner
  );
END;
$$;