
-- ============================================
-- 📚 FIX: fn_list_books_for_category
-- Retornar campos em camelCase para compatibilidade frontend
-- + incluir progresso do usuário
-- ============================================

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
BEGIN
  v_user_id := auth.uid();

  -- Buscar livros publicados e com status READY, ordenados por category e position
  -- Retornar campos em camelCase para compatibilidade com frontend
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'subtitle', b.subtitle,
        'author', b.author,
        'category', b.category::text,
        'coverUrl', b.cover_url,
        'totalPages', COALESCE(b.total_pages, 0),
        'isPublished', b.is_published,
        'status', b.status::text,
        'position', COALESCE(b.position, 999),
        'createdAt', b.created_at,
        'description', b.description,
        'viewCount', COALESCE(b.view_count, 0),
        'ratingAverage', b.rating_average,
        'ratingCount', b.rating_count,
        -- Progresso do usuário atual
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
      ) ORDER BY 
        CASE b.category::text
          WHEN 'quimica_geral' THEN 1
          WHEN 'fisico_quimica' THEN 2
          WHEN 'quimica_organica' THEN 3
          WHEN 'revisao_ciclica' THEN 4
          WHEN 'previsao_final' THEN 5
          WHEN 'exercicios' THEN 6
          WHEN 'simulados' THEN 7
          WHEN 'resumos' THEN 8
          WHEN 'mapas_mentais' THEN 9
          WHEN 'outros' THEN 10
          ELSE 99
        END,
        COALESCE(b.position, 999) ASC,
        b.title ASC
    ),
    '[]'::jsonb
  ) INTO v_books
  FROM web_books b
  WHERE b.is_published = true
    AND b.status = 'ready'
    AND (p_category IS NULL OR b.category::text = p_category);

  RETURN jsonb_build_object(
    'success', true,
    'books', v_books,
    'count', jsonb_array_length(v_books)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'books', '[]'::jsonb
  );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category(TEXT) TO anon;
