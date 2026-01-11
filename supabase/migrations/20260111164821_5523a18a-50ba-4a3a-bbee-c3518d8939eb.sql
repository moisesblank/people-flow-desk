-- FIX: Corrigir nome da coluna (total_pages, não page_count)
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
  -- Buscar livros publicados, ordenados por category e position
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'author', b.author,
        'category', b.category,
        'cover_url', b.cover_url,
        'total_pages', b.total_pages,
        'is_published', b.is_published,
        'position', COALESCE(b.position, 999),
        'created_at', b.created_at,
        'description', b.description
      ) ORDER BY 
        CASE b.category
          WHEN 'Química Geral' THEN 1
          WHEN 'Físico-Química' THEN 2
          WHEN 'Química Orgânica' THEN 3
          WHEN 'Química Ambiental' THEN 4
          WHEN 'Exercícios' THEN 5
          ELSE 6
        END,
        COALESCE(b.position, 999) ASC,
        b.title ASC
    ),
    '[]'::jsonb
  ) INTO v_books
  FROM web_books b
  WHERE b.is_published = true
    AND (p_category IS NULL OR b.category = p_category);

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