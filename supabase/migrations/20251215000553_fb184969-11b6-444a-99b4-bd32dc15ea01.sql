-- Calendar/Agenda Tasks Table
CREATE TABLE public.calendar_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_date DATE NOT NULL,
  task_time TIME,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_email TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT DEFAULT 'geral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
ON public.calendar_tasks
FOR ALL
USING (user_id = auth.uid() OR is_admin_or_owner(auth.uid()));

-- Payments Table (Course and Personal)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('curso', 'pessoal_moises', 'pessoal_bruna')),
  descricao TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  metodo_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages payments"
ON public.payments
FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- Accounting Entries Table
CREATE TABLE public.contabilidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topico TEXT NOT NULL,
  subtopico TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'investimento', 'imposto')),
  descricao TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_referencia TEXT,
  ano_referencia INTEGER,
  categoria TEXT,
  documento_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.contabilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages contabilidade"
ON public.contabilidade
FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- Marketing Metrics Table (ROI, CAC)
CREATE TABLE public.metricas_marketing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_referencia DATE NOT NULL,
  investimento_marketing INTEGER NOT NULL DEFAULT 0,
  receita_gerada INTEGER NOT NULL DEFAULT 0,
  novos_clientes INTEGER NOT NULL DEFAULT 0,
  custo_aquisicao INTEGER NOT NULL DEFAULT 0,
  roi_percentual NUMERIC(10,2) NOT NULL DEFAULT 0,
  cac NUMERIC(10,2) NOT NULL DEFAULT 0,
  ltv INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.metricas_marketing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages metricas"
ON public.metricas_marketing
FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- Professor Checklists Table
CREATE TABLE public.professor_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID NOT NULL,
  semana_inicio DATE NOT NULL,
  titulo TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.professor_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages professor checklists"
ON public.professor_checklists
FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- Website Pending Tasks Table
CREATE TABLE public.website_pendencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  area TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  responsavel TEXT,
  data_limite DATE,
  data_conclusao DATE,
  arquivos JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.website_pendencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages website pendencias"
ON public.website_pendencias
FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- File uploads tracking
CREATE TABLE public.arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER,
  url TEXT NOT NULL,
  modulo TEXT NOT NULL,
  referencia_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages arquivos"
ON public.arquivos
FOR ALL
USING (is_admin_or_owner(auth.uid()));

-- Create trigger for calendar tasks updated_at
CREATE TRIGGER update_calendar_tasks_updated_at
BEFORE UPDATE ON public.calendar_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for professor checklists updated_at
CREATE TRIGGER update_professor_checklists_updated_at
BEFORE UPDATE ON public.professor_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();