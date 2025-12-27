
-- =========================================================
-- P0 FIX (RH): triggers da tabela employees disparando em DELETE
-- Sintoma: ao excluir funcionário → "record 'old/new' has no field 'id'"
-- Causa: triggers incorretos executando funções que usam NEW em DELETE
-- =========================================================

-- 1) updated_at trigger: deve rodar só em UPDATE
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) CPF validation: deve rodar em INSERT/UPDATE, nunca em DELETE
DROP TRIGGER IF EXISTS validate_cpf_employees ON public.employees;
CREATE TRIGGER validate_cpf_employees
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_employees_trigger();
