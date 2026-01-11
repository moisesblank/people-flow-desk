-- ============================================
-- 🚨 EMERGENCY FIX: PGRST203 Function Overloading
-- CAUSA: Múltiplas versões de fn_list_books_for_category
-- SOLUÇÃO: DROP ALL + CREATE ÚNICA VERSÃO CANÔNICA
-- ============================================

-- STEP 1: DROP ALL VERSIONS (ordem de parâmetros importa)
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(uuid, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.fn_list_books_for_category(text);

-- STEP 2: CREATE CANONICAL VERSION (ADMIN_IS_TRUTH)
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
        'page_count', b.page_count,
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

-- STEP 3: Grant execute permission
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_list_books_for_category(text) TO anon;

-- STEP 4: Add comment
COMMENT ON FUNCTION public.fn_list_books_for_category(text) IS 
'CANONICAL VERSION v2.0 - Lista livros publicados por categoria com ordenação ADMIN_IS_TRUTH. 
Versão única sem overloading para evitar PGRST203.';