-- Tabela para eventos do WordPress (cadastros, acessos, etc)
CREATE TABLE public.wordpress_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'user_registered', 'user_login', 'page_view', 'form_submission'
  event_data JSONB DEFAULT '{}',
  user_email TEXT,
  user_name TEXT,
  user_ip TEXT,
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para métricas agregadas do WordPress
CREATE TABLE public.wordpress_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER DEFAULT 0,
  new_registrations INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- em segundos
  top_pages JSONB DEFAULT '[]',
  traffic_sources JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.wordpress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para owners/admins
CREATE POLICY "Owners can view wordpress events" 
ON public.wordpress_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners can view wordpress metrics" 
ON public.wordpress_metrics FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Permitir insert via service role (webhook)
CREATE POLICY "Service can insert events" 
ON public.wordpress_events FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service can insert metrics" 
ON public.wordpress_metrics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service can update metrics" 
ON public.wordpress_metrics FOR UPDATE 
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.wordpress_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wordpress_metrics;

-- Índices para performance
CREATE INDEX idx_wordpress_events_created ON public.wordpress_events(created_at DESC);
CREATE INDEX idx_wordpress_events_type ON public.wordpress_events(event_type);
CREATE INDEX idx_wordpress_metrics_date ON public.wordpress_metrics(date DESC);