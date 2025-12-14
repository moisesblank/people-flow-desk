-- Enum para roles (owner = dono, admin = gerente, employee = funcionário)
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'employee');

-- Enum para categorias de gastos
CREATE TYPE public.expense_category AS ENUM ('comida', 'casa', 'pessoal', 'transporte', 'lazer', 'outros');

-- Enum para status de funcionário
CREATE TYPE public.employee_status AS ENUM ('ativo', 'ferias', 'afastado', 'inativo');

-- Enum para setores
CREATE TYPE public.sector_type AS ENUM ('Coordenação', 'Suporte', 'Monitoria', 'Afiliados', 'Marketing', 'Administrativo', 'Financeiro', 'Vendas', 'Design', 'Gestão');

-- ============================================
-- 1. PROFILES (dados do usuário)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. USER_ROLES (controle de acesso - SEPARADO!)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. FUNÇÃO SEGURA PARA VERIFICAR ROLES
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se é owner ou admin
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin')
  )
$$;

-- ============================================
-- 4. EMPLOYEES (funcionários expandidos)
-- ============================================
CREATE TABLE public.employees (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  setor sector_type,
  salario INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  telefone TEXT,
  data_admissao DATE,
  status employee_status DEFAULT 'ativo',
  responsabilidades TEXT,
  horario_trabalho TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. PERSONAL_FIXED_EXPENSES (gastos fixos pessoais)
-- ============================================
CREATE TABLE public.personal_fixed_expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.personal_fixed_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. PERSONAL_EXTRA_EXPENSES (gastos extras pessoais)
-- ============================================
CREATE TABLE public.personal_extra_expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  categoria expense_category DEFAULT 'outros',
  data DATE DEFAULT CURRENT_DATE,
  fonte TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.personal_extra_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. COMPANY_FIXED_EXPENSES (gastos fixos empresa)
-- ============================================
CREATE TABLE public.company_fixed_expenses (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.company_fixed_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. COMPANY_EXTRA_EXPENSES (gastos extras empresa)
-- ============================================
CREATE TABLE public.company_extra_expenses (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  data DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.company_extra_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. INCOME (receitas/entradas)
-- ============================================
CREATE TABLE public.income (
  id SERIAL PRIMARY KEY,
  fonte TEXT NOT NULL,
  banco TEXT,
  valor INTEGER NOT NULL DEFAULT 0,
  mes_referencia DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. TAXES (impostos)
-- ============================================
CREATE TABLE public.taxes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  mes_referencia DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. AFFILIATES (afiliados Hotmart)
-- ============================================
CREATE TABLE public.affiliates (
  id SERIAL PRIMARY KEY,
  hotmart_id TEXT UNIQUE,
  nome TEXT NOT NULL,
  email TEXT,
  total_vendas INTEGER DEFAULT 0,
  comissao_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. SALES (vendas via webhook Hotmart)
-- ============================================
CREATE TABLE public.sales (
  id SERIAL PRIMARY KEY,
  hotmart_transaction_id TEXT UNIQUE,
  produto TEXT,
  valor INTEGER NOT NULL DEFAULT 0,
  affiliate_id INTEGER REFERENCES affiliates(id),
  comprador_email TEXT,
  comprador_nome TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. STUDENTS (alunos WordPress)
-- ============================================
CREATE TABLE public.students (
  id SERIAL PRIMARY KEY,
  wordpress_id TEXT UNIQUE,
  nome TEXT NOT NULL,
  email TEXT,
  curso TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: usuário vê próprio perfil, owner/admin vê todos
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- User Roles: apenas owner pode gerenciar roles
CREATE POLICY "Owner can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Employees: owner/admin vê todos, employee vê próprio
CREATE POLICY "Admin can manage employees" ON public.employees
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Employees can view themselves" ON public.employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Personal Fixed Expenses: usuário vê seus próprios
CREATE POLICY "Users manage own fixed expenses" ON public.personal_fixed_expenses
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Personal Extra Expenses: usuário vê seus próprios
CREATE POLICY "Users manage own extra expenses" ON public.personal_extra_expenses
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Company Fixed Expenses: owner/admin gerencia
CREATE POLICY "Admin manages company fixed expenses" ON public.company_fixed_expenses
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- Company Extra Expenses: owner/admin gerencia
CREATE POLICY "Admin manages company extra expenses" ON public.company_extra_expenses
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- Income: owner/admin gerencia
CREATE POLICY "Admin manages income" ON public.income
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- Taxes: owner/admin gerencia
CREATE POLICY "Admin manages taxes" ON public.taxes
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- Affiliates: owner/admin vê todos, afiliado vê próprio (via email)
CREATE POLICY "Admin manages affiliates" ON public.affiliates
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- Sales: owner/admin vê todas
CREATE POLICY "Admin manages sales" ON public.sales
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- Students: owner/admin vê todos
CREATE POLICY "Admin manages students" ON public.students
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

-- ============================================
-- TRIGGER PARA CRIAR PROFILE AUTOMÁTICO
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();