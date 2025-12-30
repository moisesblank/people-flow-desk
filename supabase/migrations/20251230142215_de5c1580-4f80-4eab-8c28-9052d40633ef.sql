-- Corrigir fn_list_books_for_category - erro de GROUP BY com jsonb_agg
CREATE OR REPLACE FUNCTION public.fn_list_books_for_category(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_books JSONB;
  v_user_id UUID;
  v_is_owner BOOLEAN;
  v_total INTEGER;
BEGIN
  v_user_id := auth.uid();
  v_is_owner := public.fn_is_book_owner();
  
  -- Count total
  SELECT COUNT(*) INTO v_total 
  FROM public.web_books b
  WHERE (b.status = 'ready' OR v_is_owner) 
    AND (COALESCE(b.is_published, false) = true OR v_is_owner)
    AND (p_category IS NULL OR b.category::text = p_category)
    AND (p_search IS NULL OR b.title ILIKE '%' || p_search || '%' OR b.description ILIKE '%' || p_search || '%');
  
  -- Buscar livros usando subquery para evitar erro de GROUP BY
  SELECT COALESCE(jsonb_agg(book_data), '[]'::jsonb) INTO v_books
  FROM (
    SELECT jsonb_build_object(
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
    ) AS book_data
    FROM public.web_books b
    WHERE (b.status = 'ready' OR v_is_owner) 
      AND (COALESCE(b.is_published, false) = true OR v_is_owner)
      AND (p_category IS NULL OR b.category::text = p_category)
      AND (p_search IS NULL OR b.title ILIKE '%' || p_search || '%' OR b.description ILIKE '%' || p_search || '%')
    ORDER BY b.created_at DESC 
    LIMIT p_limit OFFSET p_offset
  ) AS subquery;
  
  RETURN jsonb_build_object(
    'success', true, 
    'books', v_books, 
    'total', v_total, 
    'limit', p_limit, 
    'offset', p_offset, 
    'hasMore', (p_offset + p_limit) < v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;