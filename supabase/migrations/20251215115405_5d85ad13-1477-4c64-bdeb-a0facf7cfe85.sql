-- ============================================
-- SYNAPSE ECOSYSTEM v5.0 - Ponto Eletrônico
-- Sistema de controle de ponto com geolocalização
-- ============================================

-- Tabela de registros de ponto
CREATE TABLE public.time_clock_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('entrada', 'saida', 'inicio_almoco', 'fim_almoco')),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_address TEXT,
  ip_address TEXT,
  device_info TEXT,
  photo_url TEXT,
  notes TEXT,
  is_manual BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações de ponto por funcionário
CREATE TABLE public.time_clock_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id INTEGER NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  work_start_time TIME DEFAULT '08:00:00',
  work_end_time TIME DEFAULT '17:00:00',
  lunch_start_time TIME DEFAULT '12:00:00',
  lunch_end_time TIME DEFAULT '13:00:00',
  tolerance_minutes INTEGER DEFAULT 15,
  require_photo BOOLEAN DEFAULT false,
  require_location BOOLEAN DEFAULT true,
  allowed_locations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relatórios de horas
CREATE TABLE public.time_clock_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_worked_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, report_date)
);

-- Tabela de justificativas de ausência
CREATE TABLE public.time_clock_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  absence_type TEXT NOT NULL CHECK (absence_type IN ('falta', 'atestado', 'ferias', 'licenca', 'folga', 'outro')),
  justification TEXT,
  document_url TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de notificações WhatsApp
CREATE TABLE public.whatsapp_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  external_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de templates de mensagens WhatsApp
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configuração MFA/2FA
CREATE TABLE public.user_mfa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_type TEXT DEFAULT 'totp' CHECK (mfa_type IN ('totp', 'sms', 'email')),
  totp_secret TEXT,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  phone_number TEXT,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.time_clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para time_clock_entries
CREATE POLICY "Admin gerencia pontos" ON public.time_clock_entries
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário vê próprios pontos" ON public.time_clock_entries
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Funcionário registra próprio ponto" ON public.time_clock_entries
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Políticas RLS para time_clock_settings
CREATE POLICY "Admin gerencia configurações ponto" ON public.time_clock_settings
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Políticas RLS para time_clock_reports
CREATE POLICY "Admin gerencia relatórios ponto" ON public.time_clock_reports
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário vê próprios relatórios" ON public.time_clock_reports
FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- Políticas RLS para time_clock_absences
CREATE POLICY "Admin gerencia ausências" ON public.time_clock_absences
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Funcionário gerencia próprias ausências" ON public.time_clock_absences
FOR ALL TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- Políticas RLS para whatsapp_notifications
CREATE POLICY "Admin gerencia notificações WhatsApp" ON public.whatsapp_notifications
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuário vê próprias notificações" ON public.whatsapp_notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Políticas RLS para whatsapp_templates
CREATE POLICY "Admin gerencia templates WhatsApp" ON public.whatsapp_templates
FOR ALL TO authenticated
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Usuários podem ver templates ativos" ON public.whatsapp_templates
FOR SELECT TO authenticated
USING (is_active = true);

-- Políticas RLS para user_mfa_settings
CREATE POLICY "Usuário gerencia próprio MFA" ON public.user_mfa_settings
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin pode ver MFA" ON public.user_mfa_settings
FOR SELECT TO authenticated
USING (is_admin_or_owner(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_time_clock_settings_updated_at
BEFORE UPDATE ON public.time_clock_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_clock_reports_updated_at
BEFORE UPDATE ON public.time_clock_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_mfa_settings_updated_at
BEFORE UPDATE ON public.user_mfa_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_time_clock_entries_employee ON public.time_clock_entries(employee_id);
CREATE INDEX idx_time_clock_entries_date ON public.time_clock_entries(registered_at);
CREATE INDEX idx_time_clock_entries_user ON public.time_clock_entries(user_id);
CREATE INDEX idx_time_clock_reports_employee_date ON public.time_clock_reports(employee_id, report_date);
CREATE INDEX idx_whatsapp_notifications_status ON public.whatsapp_notifications(status);
CREATE INDEX idx_whatsapp_notifications_user ON public.whatsapp_notifications(user_id);

-- Inserir templates padrão de WhatsApp
INSERT INTO public.whatsapp_templates (name, category, content, variables) VALUES
('welcome_student', 'onboarding', 'Olá {{name}}! Bem-vindo ao curso do Prof. Moisés Medeiros. Acesse sua área: {{link}}', '["name", "link"]'),
('payment_reminder', 'billing', 'Olá {{name}}, sua fatura de R$ {{amount}} vence em {{date}}. Evite juros!', '["name", "amount", "date"]'),
('class_reminder', 'education', 'Lembrete: Sua aula "{{class_name}}" começa em {{time}}. Não perca!', '["class_name", "time"]'),
('point_registered', 'hr', '{{name}}, seu ponto foi registrado: {{type}} às {{time}}', '["name", "type", "time"]');