-- =============================================
-- CORREÇÃO: SEARCH PATH DAS FUNÇÕES
-- =============================================

-- Corrigir função update_transacoes_hotmart_updated_at
CREATE OR REPLACE FUNCTION public.update_transacoes_hotmart_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- SEGURANÇA: RLS POLICIES ADICIONAIS
-- =============================================

-- Garantir RLS ativado nas tabelas principais
ALTER TABLE IF EXISTS public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacoes_hotmart_completo ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes para recriar (evitar duplicatas)
DROP POLICY IF EXISTS "Service role full access alunos" ON public.alunos;
DROP POLICY IF EXISTS "Service role full access employees" ON public.employees;
DROP POLICY IF EXISTS "Service role full access entradas" ON public.entradas;
DROP POLICY IF EXISTS "Service role full access contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Service role full access hotmart" ON public.transacoes_hotmart_completo;

-- Policies para service role (edge functions)
CREATE POLICY "Service role full access alunos" 
  ON public.alunos 
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access employees" 
  ON public.employees 
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access entradas" 
  ON public.entradas 
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access contas_pagar" 
  ON public.contas_pagar 
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access hotmart" 
  ON public.transacoes_hotmart_completo 
  FOR ALL 
  USING (auth.role() = 'service_role');