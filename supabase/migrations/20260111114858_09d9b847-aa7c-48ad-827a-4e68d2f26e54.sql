-- ============================================
-- 🚀 PATCH 5K: RPC para batch update de posições
-- Substitui N updates sequenciais por 1 chamada
-- ============================================

CREATE OR REPLACE FUNCTION public.batch_update_lesson_positions(
  updates JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE lessons 
    SET position = (item->>'position')::INT
    WHERE id = (item->>'id')::UUID;
  END LOOP;
END;
$$;

-- Permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.batch_update_lesson_positions(JSONB) TO authenticated;