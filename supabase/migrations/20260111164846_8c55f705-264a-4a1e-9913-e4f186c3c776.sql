-- FIX FINAL: Usar valores corretos do ENUM web_book_category (snake_case)
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
BEGIN
  -- Buscar livros publicados e com status READY, ordenados por category e position
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'author', b.author,
        'category', b.category::text,
        'cover_url', b.cover_url,
        'total_pages', b.total_pages,
        'is_published', b.is_published,
        'status', b.status::text,
        'position', COALESCE(b.position, 999),
        'created_at', b.created_at,
        'description', b.description
      ) ORDER BY 
        CASE b.category::text
          WHEN 'quimica_geral' THEN 1
          WHEN 'fisico_quimica' THEN 2
          WHEN 'quimica_organica' THEN 3
          WHEN 'revisao_ciclica' THEN 4
          WHEN 'exercicios' THEN 5
          WHEN 'simulados' THEN 6
          WHEN 'resumos' THEN 7
          WHEN 'mapas_mentais' THEN 8
          WHEN 'outros' THEN 9
          ELSE 10
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