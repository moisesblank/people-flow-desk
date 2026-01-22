-- =====================================================
-- FASE 1: REVOGAÇÃO DINÂMICA DE EXECUTE ANON
-- Abordagem: Loop automático por todas as funções SECURITY DEFINER
-- =====================================================

DO $$
DECLARE
  func_record RECORD;
  revoke_sql TEXT;
  success_count INTEGER := 0;
  fail_count INTEGER := 0;
BEGIN
  FOR func_record IN
    SELECT 
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args,
      p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    BEGIN
      revoke_sql := 'REVOKE EXECUTE ON FUNCTION public.' || 
                    quote_ident(func_record.function_name) || 
                    '(' || func_record.args || ') FROM anon';
      EXECUTE revoke_sql;
      success_count := success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      fail_count := fail_count + 1;
      RAISE NOTICE 'Falha ao revogar %: %', func_record.function_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'FASE 1 COMPLETA: % funções revogadas, % falhas', success_count, fail_count;
END;
$$;