-- ============================================
-- MIGRATION: ADMIN_IS_TRUTH - Ordenação Absoluta por Position
-- Corrige fn_list_books_for_category para ordenar por position ASC
-- Garantindo sincronização perfeita entre gestão e aluno
-- ============================================

-- DROP da versão antiga (com 1 parâmetro)
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(TEXT);

-- RECRIAR função com ordenação correta por POSITION
CREATE OR REPLACE FUNCTION public.fn_list_books_for_category(
  p_category TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_books JSONB;
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  v_is_owner := public.fn_is_book_owner();
  
  -- Buscar livros ORDENADOS POR POSITION (Admin-defined order)
  SELECT COALESCE(jsonb_agg(book_data ORDER BY category_order, position_order), '[]'::jsonb) 
  INTO v_books
  FROM (
    SELECT 
      jsonb_build_object(
        'id', b.id, 
        'title', b.title, 
        'subtitle', b.subtitle, 
        'author', b.author, 
        'category', b.category,
        'totalPages', b.total_pages, 
        'coverUrl', b.cover_url, 
        'ratingAverage', b.rating_average,
        'ratingCount', b.rating_count, 
        'viewCount', b.view_count, 
        'createdAt', b.created_at, 
        'status', b.status,
        'isPublished', b.is_published,
        'position', b.position,
        'progress', (
          SELECT jsonb_build_object(
            'currentPage', COALESCE(p.current_page, 0), 
            'progressPercent', COALESCE(p.progress_percent, 0), 
            'isCompleted', COALESCE(p.is_completed, false), 
            'lastReadAt', p.last_read_at
          )
          FROM public.user_book_progress p 
          WHERE p.user_id = v_user_id AND p.book_id = b.id
        )
      ) AS book_data,
      -- Ordenação por categoria canônica
      CASE b.category::text
        WHEN 'quimica_geral' THEN 1
        WHEN 'quimica_organica' THEN 2
        WHEN 'fisico_quimica' THEN 3
        WHEN 'revisao_ciclica' THEN 4
        WHEN 'previsao_final' THEN 5
        ELSE 99
      END AS category_order,
      -- Ordenação por position dentro da categoria
      COALESCE(b.position, 999) AS position_order
    FROM public.web_books b
    WHERE (b.status = 'ready' OR v_is_owner) 
      AND (COALESCE(b.is_published, false) = true OR v_is_owner)
      AND (p_category IS NULL OR b.category::text = p_category)
  ) AS subquery;
  
  RETURN jsonb_build_object(
    'success', true, 
    'books', v_books
  );
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.fn_list_books_for_category(TEXT) IS 
'Lista livros ordenados por POSITION definida na gestão. ADMIN_IS_TRUTH: /alunos/livro-web espelha /gestaofc/livros-web em tempo real.';

-- Habilitar realtime para web_books (se ainda não estiver)
ALTER TABLE public.web_books REPLICA IDENTITY FULL;