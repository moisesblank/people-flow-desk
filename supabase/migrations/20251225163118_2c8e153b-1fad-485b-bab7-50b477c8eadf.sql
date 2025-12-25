
-- =====================================================
-- MIGRATION v17.7b: AUDITORIA FINANCEIRA + VALIDAÇÃO CPF (CORRIGIDO)
-- Prioridade: P1 (HOJE)
-- Tabelas com CPF: profiles, alunos (employees NÃO tem CPF)
-- =====================================================

-- =====================================================
-- PARTE 1: FUNÇÃO DE VALIDAÇÃO CPF BRASILEIRO
-- Algoritmo oficial: valida os 2 dígitos verificadores
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_valid_cpf(cpf_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpf_clean TEXT;
  cpf_digits INT[];
  sum1 INT := 0;
  sum2 INT := 0;
  digit1 INT;
  digit2 INT;
  i INT;
BEGIN
  -- Limpar CPF (remover pontos, traços, espaços)
  cpf_clean := regexp_replace(cpf_input, '[^0-9]', '', 'g');
  
  -- CPF deve ter exatamente 11 dígitos
  IF length(cpf_clean) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Rejeitar CPFs com todos os dígitos iguais (ex: 000.000.000-00, 111.111.111-11)
  IF cpf_clean ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Converter para array de inteiros
  FOR i IN 1..11 LOOP
    cpf_digits[i] := substring(cpf_clean, i, 1)::INT;
  END LOOP;
  
  -- Cálculo do primeiro dígito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (cpf_digits[i] * (11 - i));
  END LOOP;
  
  digit1 := (sum1 * 10) % 11;
  IF digit1 = 10 THEN
    digit1 := 0;
  END IF;
  
  -- Verificar primeiro dígito
  IF digit1 != cpf_digits[10] THEN
    RETURN FALSE;
  END IF;
  
  -- Cálculo do segundo dígito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (cpf_digits[i] * (12 - i));
  END LOOP;
  
  digit2 := (sum2 * 10) % 11;
  IF digit2 = 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verificar segundo dígito
  IF digit2 != cpf_digits[11] THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.is_valid_cpf(TEXT) IS 
'Valida CPF brasileiro usando algoritmo oficial dos 2 dígitos verificadores. Rejeita CPFs inválidos como 000.000.000-00';

-- =====================================================
-- PARTE 2: FUNÇÃO DE SANITIZAÇÃO CPF (formato padrão)
-- =====================================================

CREATE OR REPLACE FUNCTION public.sanitize_cpf(cpf_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpf_clean TEXT;
BEGIN
  IF cpf_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  cpf_clean := regexp_replace(cpf_input, '[^0-9]', '', 'g');
  
  IF length(cpf_clean) != 11 THEN
    RETURN NULL;
  END IF;
  
  RETURN cpf_clean;
END;
$$;

-- =====================================================
-- PARTE 3: TRIGGER PARA VALIDAR CPF EM PROFILES
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_cpf_profiles_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpf_clean TEXT;
BEGIN
  -- Se CPF foi fornecido, validar
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    cpf_clean := public.sanitize_cpf(NEW.cpf);
    
    IF cpf_clean IS NULL OR NOT public.is_valid_cpf(cpf_clean) THEN
      RAISE EXCEPTION 'CPF inválido. Por favor, insira um CPF brasileiro válido.'
        USING HINT = 'CPFs como 000.000.000-00 ou com dígitos verificadores incorretos são rejeitados';
    END IF;
    
    NEW.cpf := cpf_clean;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_cpf_profiles ON public.profiles;
CREATE TRIGGER validate_cpf_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_profiles_trigger();

-- =====================================================
-- PARTE 4: TRIGGER PARA VALIDAR CPF EM ALUNOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_cpf_alunos_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpf_clean TEXT;
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    cpf_clean := public.sanitize_cpf(NEW.cpf);
    
    IF cpf_clean IS NULL OR NOT public.is_valid_cpf(cpf_clean) THEN
      RAISE EXCEPTION 'CPF inválido. Por favor, insira um CPF brasileiro válido.'
        USING HINT = 'CPFs como 000.000.000-00 ou com dígitos verificadores incorretos são rejeitados';
    END IF;
    
    NEW.cpf := cpf_clean;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_cpf_alunos ON public.alunos;
CREATE TRIGGER validate_cpf_alunos
  BEFORE INSERT OR UPDATE ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_alunos_trigger();

-- =====================================================
-- PARTE 5: AUDITORIA PARA TABELAS FINANCEIRAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_financial_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_record JSONB;
  new_record JSONB;
  action_type TEXT;
  user_email TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    action_type := 'FINANCIAL_DELETE';
    old_record := to_jsonb(OLD);
    new_record := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'FINANCIAL_UPDATE';
    old_record := to_jsonb(OLD);
    new_record := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    action_type := 'FINANCIAL_INSERT';
    old_record := NULL;
    new_record := to_jsonb(NEW);
  END IF;
  
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    user_id,
    metadata,
    created_at
  ) VALUES (
    action_type,
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT ELSE NEW.id::TEXT END,
      'unknown'
    ),
    old_record,
    new_record,
    auth.uid(),
    jsonb_build_object(
      'user_email', user_email,
      'operation', TG_OP,
      'table_schema', TG_TABLE_SCHEMA,
      'trigger_name', TG_NAME,
      'audit_type', 'FINANCIAL',
      'timestamp', now()
    ),
    now()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- PARTE 6: APLICAR AUDITORIA NAS TABELAS FINANCEIRAS
-- =====================================================

DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

DROP TRIGGER IF EXISTS audit_comissoes ON public.comissoes;
CREATE TRIGGER audit_comissoes
  AFTER INSERT OR UPDATE OR DELETE ON public.comissoes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

DROP TRIGGER IF EXISTS audit_command_finance ON public.command_finance;
CREATE TRIGGER audit_command_finance
  AFTER INSERT OR UPDATE OR DELETE ON public.command_finance
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

DROP TRIGGER IF EXISTS audit_company_extra_expenses ON public.company_extra_expenses;
CREATE TRIGGER audit_company_extra_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.company_extra_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

DROP TRIGGER IF EXISTS audit_company_fixed_expenses ON public.company_fixed_expenses;
CREATE TRIGGER audit_company_fixed_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.company_fixed_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

DROP TRIGGER IF EXISTS audit_bank_accounts ON public.bank_accounts;
CREATE TRIGGER audit_bank_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

DROP TRIGGER IF EXISTS audit_financial_categories ON public.financial_categories;
CREATE TRIGGER audit_financial_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_changes();

-- =====================================================
-- PARTE 7: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_financial 
ON public.audit_logs (action, table_name, created_at DESC)
WHERE action LIKE 'FINANCIAL_%';

CREATE INDEX IF NOT EXISTS idx_profiles_cpf 
ON public.profiles (cpf) 
WHERE cpf IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alunos_cpf 
ON public.alunos (cpf) 
WHERE cpf IS NOT NULL;

-- =====================================================
-- PARTE 8: FUNÇÃO PARA AUDITAR CPFs INVÁLIDOS EXISTENTES
-- (apenas profiles e alunos que têm CPF)
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_invalid_cpfs()
RETURNS TABLE (
  tabela TEXT,
  registro_id TEXT,
  cpf_value TEXT,
  motivo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar profiles
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    p.id::TEXT,
    p.cpf,
    CASE 
      WHEN p.cpf ~ '^(\d)\1{10}$' THEN 'CPF com todos dígitos iguais'
      WHEN length(regexp_replace(p.cpf, '[^0-9]', '', 'g')) != 11 THEN 'CPF não tem 11 dígitos'
      WHEN NOT public.is_valid_cpf(p.cpf) THEN 'Dígitos verificadores inválidos'
      ELSE 'Outro erro'
    END
  FROM public.profiles p
  WHERE p.cpf IS NOT NULL 
    AND p.cpf != ''
    AND NOT public.is_valid_cpf(p.cpf);
  
  -- Verificar alunos
  RETURN QUERY
  SELECT 
    'alunos'::TEXT,
    a.id::TEXT,
    a.cpf,
    CASE 
      WHEN a.cpf ~ '^(\d)\1{10}$' THEN 'CPF com todos dígitos iguais'
      WHEN length(regexp_replace(a.cpf, '[^0-9]', '', 'g')) != 11 THEN 'CPF não tem 11 dígitos'
      WHEN NOT public.is_valid_cpf(a.cpf) THEN 'Dígitos verificadores inválidos'
      ELSE 'Outro erro'
    END
  FROM public.alunos a
  WHERE a.cpf IS NOT NULL 
    AND a.cpf != ''
    AND NOT public.is_valid_cpf(a.cpf);
END;
$$;

COMMENT ON FUNCTION public.audit_invalid_cpfs() IS 
'Retorna lista de CPFs inválidos existentes no banco para limpeza manual. Apenas tabelas profiles e alunos.';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  invalid_count INT;
BEGIN
  SELECT COUNT(*) INTO invalid_count 
  FROM public.audit_invalid_cpfs();
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '⚠️ Encontrados % CPFs inválidos existentes. Execute SELECT * FROM audit_invalid_cpfs() para ver detalhes.', invalid_count;
  ELSE
    RAISE NOTICE '✅ Nenhum CPF inválido encontrado no banco.';
  END IF;
END;
$$;
