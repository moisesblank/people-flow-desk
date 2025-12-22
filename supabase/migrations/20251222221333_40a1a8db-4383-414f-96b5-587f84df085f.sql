-- Drop funções conflitantes antes de recriar
DROP FUNCTION IF EXISTS public.fn_get_user_annotations(UUID);
DROP FUNCTION IF EXISTS public.fn_get_user_annotations();

-- Recriar função com assinatura correta
CREATE OR REPLACE FUNCTION public.fn_get_user_annotations(p_book_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_annotations JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'pageNumber', page_number,
      'type', annotation_type,
      'content', content,
      'positionX', position_x,
      'positionY', position_y,
      'width', width,
      'height', height,
      'color', color,
      'createdAt', created_at
    ) ORDER BY page_number, created_at
  ) INTO v_annotations
  FROM public.user_annotations
  WHERE user_id = v_user_id AND book_id = p_book_id AND is_deleted = false;
  
  RETURN jsonb_build_object(
    'success', true,
    'annotations', COALESCE(v_annotations, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant
GRANT EXECUTE ON FUNCTION public.fn_get_user_annotations(UUID) TO authenticated;