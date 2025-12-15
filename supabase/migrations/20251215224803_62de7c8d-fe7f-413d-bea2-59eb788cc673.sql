-- FASE 1B: Funções e Tabelas

-- Função get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Função can_view_financial
CREATE OR REPLACE FUNCTION public.can_view_financial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('owner', 'admin', 'contabilidade')
  )
$$;

-- Função can_view_personal (apenas owner)
CREATE OR REPLACE FUNCTION public.can_view_personal(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'owner')
$$;

-- Contas bancárias
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT,
  account_type TEXT DEFAULT 'corrente',
  initial_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  color TEXT DEFAULT '#DC2626',
  is_personal BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias financeiras
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#666',
  icon TEXT,
  is_personal BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.financial_categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transações financeiras unificadas
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  category_id UUID REFERENCES public.financial_categories(id),
  account_id UUID REFERENCES public.bank_accounts(id),
  is_personal BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT,
  notes TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ponto eletrônico
CREATE TABLE IF NOT EXISTS public.time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tarefas gerais
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  assigned_to INTEGER REFERENCES public.employees(id),
  assigned_to_user UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reagentes de laboratório
CREATE TABLE IF NOT EXISTS public.reagents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  formula TEXT,
  cas_number TEXT,
  quantity DECIMAL(10,3) DEFAULT 0,
  unit TEXT DEFAULT 'g',
  min_quantity DECIMAL(10,3) DEFAULT 0,
  location TEXT,
  expiry_date DATE,
  supplier TEXT,
  is_hazardous BOOLEAN DEFAULT false,
  safety_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipamentos de laboratório
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  location TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'broken')),
  last_maintenance DATE,
  next_maintenance DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pets (vida pessoal - apenas owner)
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  birth_date DATE,
  weight DECIMAL(5,2),
  avatar_url TEXT,
  vet_name TEXT,
  vet_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vacinas dos pets
CREATE TABLE IF NOT EXISTS public.pet_vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applied_date DATE,
  next_date DATE,
  vet_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Veículos (vida pessoal - apenas owner)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INT,
  plate TEXT,
  color TEXT,
  fuel_type TEXT,
  current_km INT DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Manutenções de veículos
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  km_at_service INT,
  next_km INT,
  cost DECIMAL(15,2),
  service_date DATE,
  next_service_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Despesas pessoais (vida pessoal - apenas owner)
CREATE TABLE IF NOT EXISTS public.personal_expenses_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para todas as novas tabelas
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses_v2 ENABLE ROW LEVEL SECURITY;

-- Policies para bank_accounts
CREATE POLICY "auth_read_bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated 
  USING (NOT is_personal OR public.is_owner(auth.uid()));
CREATE POLICY "financial_manage_bank_accounts" ON public.bank_accounts FOR ALL 
  USING (public.can_view_financial(auth.uid()));

-- Policies para financial_categories
CREATE POLICY "auth_read_financial_categories" ON public.financial_categories FOR SELECT TO authenticated 
  USING (NOT is_personal OR public.is_owner(auth.uid()));
CREATE POLICY "owner_manage_financial_categories" ON public.financial_categories FOR ALL 
  USING (public.is_owner(auth.uid()));

-- Policies para transactions
CREATE POLICY "auth_read_transactions" ON public.transactions FOR SELECT TO authenticated 
  USING (NOT is_personal OR public.is_owner(auth.uid()));
CREATE POLICY "financial_manage_transactions" ON public.transactions FOR ALL 
  USING (public.can_view_financial(auth.uid()));

-- Policies para time_tracking
CREATE POLICY "auth_read_time_tracking" ON public.time_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "own_insert_time_tracking" ON public.time_tracking FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_time_tracking" ON public.time_tracking FOR ALL 
  USING (public.is_admin_or_owner(auth.uid()));

-- Policies para tasks
CREATE POLICY "auth_read_tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_manage_tasks" ON public.tasks FOR ALL TO authenticated USING (true);

-- Policies para reagents
CREATE POLICY "auth_read_reagents" ON public.reagents FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_reagents" ON public.reagents FOR ALL 
  USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'coordenacao'));

-- Policies para equipment
CREATE POLICY "auth_read_equipment" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_equipment" ON public.equipment FOR ALL 
  USING (public.is_admin_or_owner(auth.uid()) OR public.has_role(auth.uid(), 'coordenacao'));

-- Policies para pets (apenas owner)
CREATE POLICY "owner_only_pets" ON public.pets FOR ALL USING (public.is_owner(auth.uid()));

-- Policies para pet_vaccines (apenas owner)
CREATE POLICY "owner_only_pet_vaccines" ON public.pet_vaccines FOR ALL USING (public.is_owner(auth.uid()));

-- Policies para vehicles (apenas owner)
CREATE POLICY "owner_only_vehicles" ON public.vehicles FOR ALL USING (public.is_owner(auth.uid()));

-- Policies para vehicle_maintenance (apenas owner)
CREATE POLICY "owner_only_vehicle_maintenance" ON public.vehicle_maintenance FOR ALL USING (public.is_owner(auth.uid()));

-- Policies para personal_expenses_v2 (apenas owner)
CREATE POLICY "owner_only_personal_expenses_v2" ON public.personal_expenses_v2 FOR ALL USING (public.is_owner(auth.uid()));

-- Categorias financeiras padrão
INSERT INTO public.financial_categories (name, type, color, icon, is_personal) VALUES
('Vendas de Cursos', 'income', '#22C55E', 'graduation-cap', false),
('Consultorias', 'income', '#3B82F6', 'briefcase', false),
('Aulas Particulares', 'income', '#8B5CF6', 'user', false),
('Comissões Afiliados', 'income', '#F59E0B', 'users', false),
('Salários', 'expense', '#EF4444', 'wallet', false),
('Equipamentos Lab', 'expense', '#6366F1', 'cpu', false),
('Marketing Digital', 'expense', '#EC4899', 'megaphone', false),
('Reagentes Químicos', 'expense', '#14B8A6', 'flask-conical', false),
('Aluguel/Infraestrutura', 'expense', '#F97316', 'home', false),
('Alimentação', 'expense', '#84CC16', 'utensils', true),
('Transporte', 'expense', '#06B6D4', 'car', true),
('Saúde', 'expense', '#EF4444', 'heart-pulse', true),
('Lazer', 'expense', '#A855F7', 'gamepad-2', true),
('Pets', 'expense', '#F59E0B', 'paw-print', true)
ON CONFLICT DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON public.transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_time_tracking_user ON public.time_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_reagents_expiry ON public.reagents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);