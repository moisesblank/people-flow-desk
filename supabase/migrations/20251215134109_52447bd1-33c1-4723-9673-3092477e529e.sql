-- Tabela para tarefas da equipe de desenvolvimento
CREATE TABLE public.dev_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_name TEXT NOT NULL,
  member_role TEXT DEFAULT 'Desenvolvedor',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baixa')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para checklist do estúdio
CREATE TABLE public.studio_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações de logo/branding
CREATE TABLE public.branding_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7D1128',
  secondary_color TEXT DEFAULT '#1E3A5F',
  company_name TEXT DEFAULT 'Moisés Medeiros',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dev_tasks
CREATE POLICY "Admin manages dev tasks" 
ON public.dev_tasks 
FOR ALL 
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- RLS Policies for studio_checklist
CREATE POLICY "Admin manages studio checklist" 
ON public.studio_checklist 
FOR ALL 
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- RLS Policies for branding_settings
CREATE POLICY "Admin manages branding" 
ON public.branding_settings 
FOR ALL 
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

CREATE POLICY "Anyone can view branding" 
ON public.branding_settings 
FOR SELECT 
USING (true);

-- Insert default branding
INSERT INTO public.branding_settings (company_name, primary_color, secondary_color) 
VALUES ('Moisés Medeiros', '#7D1128', '#1E3A5F');

-- Insert default studio checklist items
INSERT INTO public.studio_checklist (task, category) VALUES
('Verificar iluminação', 'Equipamento'),
('Testar áudio', 'Equipamento'),
('Backup das gravações', 'Pós-produção'),
('Atualizar OBS', 'Software'),
('Limpar lentes', 'Equipamento'),
('Verificar espaço em disco', 'Software'),
('Testar conexão internet', 'Infraestrutura'),
('Preparar roteiro', 'Conteúdo');

-- Trigger for updated_at
CREATE TRIGGER update_dev_tasks_updated_at
BEFORE UPDATE ON public.dev_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branding_updated_at
BEFORE UPDATE ON public.branding_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();