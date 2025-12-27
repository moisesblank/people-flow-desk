
-- ==============================================
-- FIX: Trigger update_updated_at incorretamente configurado para DELETE
-- O trigger tenta acessar NEW em DELETE, causando:
-- ERROR: record "new" has no field "id"
-- ==============================================

-- Drop o trigger incorreto
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;

-- Recriar o trigger APENAS para UPDATE (não DELETE)
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
