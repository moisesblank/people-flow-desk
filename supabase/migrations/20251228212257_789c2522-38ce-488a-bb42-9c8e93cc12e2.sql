-- ============================================
-- PARTE 2: HARD IDENTITY CONSTRAINTS
-- 1 EMAIL = 1 PESSOA = 1 LOGIN
-- Normalização: LOWERCASE + TRIM
-- ============================================

-- ============================================
-- 1. FUNÇÃO DE NORMALIZAÇÃO DE EMAIL
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_email(email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT LOWER(TRIM(COALESCE(email, '')))
$$;

-- ============================================
-- 2. FUNÇÃO DE VERIFICAÇÃO GLOBAL DE EMAIL
-- Verifica se email existe em qualquer tabela de identidade
-- ============================================
CREATE OR REPLACE FUNCTION public.email_exists_globally(
  check_email TEXT,
  exclude_table TEXT DEFAULT NULL,
  exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT;
  found BOOLEAN := FALSE;
BEGIN
  normalized_email := public.normalize_email(check_email);
  
  IF normalized_email = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar em auth.users
  IF exclude_table IS DISTINCT FROM 'auth.users' THEN
    SELECT EXISTS(
      SELECT 1 FROM auth.users 
      WHERE LOWER(TRIM(email)) = normalized_email
      AND (exclude_id IS NULL OR id != exclude_id)
    ) INTO found;
    IF found THEN RETURN TRUE; END IF;
  END IF;
  
  -- Verificar em profiles
  IF exclude_table IS DISTINCT FROM 'profiles' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE public.normalize_email(email) = normalized_email
      AND (exclude_id IS NULL OR id != exclude_id)
    ) INTO found;
    IF found THEN RETURN TRUE; END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ============================================
-- 3. UNIQUE INDEX EM PROFILES (case-insensitive)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique_lower 
ON public.profiles (LOWER(TRIM(email))) 
WHERE email IS NOT NULL;

-- ============================================
-- 4. UNIQUE INDEX EM EMPLOYEES (case-insensitive)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique_lower 
ON public.employees (LOWER(TRIM(email))) 
WHERE email IS NOT NULL;

-- ============================================
-- 5. UNIQUE INDEX EM AFFILIATES (case-insensitive)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_email_unique_lower 
ON public.affiliates (LOWER(TRIM(email))) 
WHERE email IS NOT NULL;

-- ============================================
-- 6. TRIGGER: Normalizar email em PROFILES antes de insert/update
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := public.normalize_email(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_profile_email ON public.profiles;
CREATE TRIGGER trg_normalize_profile_email
  BEFORE INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_profile_email();

-- ============================================
-- 7. TRIGGER: Normalizar email em EMPLOYEES antes de insert/update
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_employee_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := public.normalize_email(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_employee_email ON public.employees;
CREATE TRIGGER trg_normalize_employee_email
  BEFORE INSERT OR UPDATE OF email ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_employee_email();

-- ============================================
-- 8. TRIGGER: Normalizar email em ALUNOS antes de insert/update
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_aluno_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := public.normalize_email(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_aluno_email ON public.alunos;
CREATE TRIGGER trg_normalize_aluno_email
  BEFORE INSERT OR UPDATE OF email ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_aluno_email();

-- ============================================
-- 9. TRIGGER: Normalizar email em AFFILIATES antes de insert/update
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_affiliate_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := public.normalize_email(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_affiliate_email ON public.affiliates;
CREATE TRIGGER trg_normalize_affiliate_email
  BEFORE INSERT OR UPDATE OF email ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_affiliate_email();

-- ============================================
-- 10. Normalizar emails existentes (one-time cleanup)
-- ============================================
UPDATE public.profiles SET email = public.normalize_email(email) WHERE email IS NOT NULL AND email != public.normalize_email(email);
UPDATE public.employees SET email = public.normalize_email(email) WHERE email IS NOT NULL AND email != public.normalize_email(email);
UPDATE public.alunos SET email = public.normalize_email(email) WHERE email IS NOT NULL AND email != public.normalize_email(email);
UPDATE public.affiliates SET email = public.normalize_email(email) WHERE email IS NOT NULL AND email != public.normalize_email(email);