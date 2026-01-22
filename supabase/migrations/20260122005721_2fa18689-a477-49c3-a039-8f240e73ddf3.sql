-- =====================================================
-- FASE 1: REVOGAÇÃO COMPLETA (ANON + PUBLIC)
-- O role anon herda de public, então preciso revogar de ambos
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
    AND (has_function_privilege('anon', p.oid, 'EXECUTE') 
         OR has_function_privilege('public', p.oid, 'EXECUTE'))
  LOOP
    BEGIN
      -- Revogar de PUBLIC (de onde anon herda)
      revoke_sql := 'REVOKE EXECUTE ON FUNCTION public.' || 
                    quote_ident(func_record.function_name) || 
                    '(' || func_record.args || ') FROM public';
      EXECUTE revoke_sql;
      
      -- Revogar diretamente de ANON também
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
  
  RAISE NOTICE 'FASE 1 COMPLETA: % funções revogadas de public+anon, % falhas', success_count, fail_count;
END;
$$;