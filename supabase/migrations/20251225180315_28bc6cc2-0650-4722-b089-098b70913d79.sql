-- ============================================
-- MIGRAÇÃO: Adicionar trigger de validação CPF em employees
-- Lei III - Segurança de Dados
-- ============================================

-- Criar trigger para validar CPF em employees (se coluna existir)
DO $$
BEGIN
  -- Verificar se a coluna cpf existe na tabela employees
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'cpf'
  ) THEN
    -- Criar a função de trigger se não existir
    CREATE OR REPLACE FUNCTION public.validate_cpf_employees_trigger()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
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
    $func$;

    -- Criar o trigger
    DROP TRIGGER IF EXISTS validate_cpf_employees ON public.employees;
    CREATE TRIGGER validate_cpf_employees
      BEFORE INSERT OR UPDATE ON public.employees
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_cpf_employees_trigger();
      
    RAISE NOTICE 'Trigger validate_cpf_employees criado com sucesso';
  ELSE
    RAISE NOTICE 'Coluna cpf não existe em employees - pulando criação do trigger';
  END IF;
END $$;

-- Adicionar coluna cpf em employees se não existir
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Criar trigger novamente após garantir que coluna existe
CREATE OR REPLACE FUNCTION public.validate_cpf_employees_trigger()
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

DROP TRIGGER IF EXISTS validate_cpf_employees ON public.employees;
CREATE TRIGGER validate_cpf_employees
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_employees_trigger();

-- Criar índice para CPF em employees (para evitar duplicatas no futuro se necessário)
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON public.employees(cpf) WHERE cpf IS NOT NULL;