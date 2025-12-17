-- ==============================================================================
-- CENTRO DE COMANDO WHATSAPP - ESTRUTURA COMPLETA
-- ==============================================================================

-- 1. CONVERSAS WHATSAPP (substituir whatsapp_leads por estrutura mais robusta)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  display_name TEXT,
  owner_detected BOOLEAN DEFAULT false,
  owner_name TEXT,
  session_mode TEXT DEFAULT 'ASSISTOR_OFF' CHECK (session_mode IN ('ASSISTOR_ON', 'ASSISTOR_OFF')),
  session_started_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  crm_stage TEXT DEFAULT 'lead' CHECK (crm_stage IN ('lead', 'prospect', 'customer', 'vip')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MENSAGENS WHATSAPP
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_id TEXT UNIQUE NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'interactive', 'location', 'contacts', 'unknown')),
  message_text TEXT,
  from_phone TEXT NOT NULL,
  to_phone TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  handled_by TEXT DEFAULT 'system_router' CHECK (handled_by IN ('manychat', 'chatgpt_tramon', 'system_router', 'manual')),
  trigger_detected BOOLEAN DEFAULT false,
  trigger_name TEXT,
  is_read BOOLEAN DEFAULT false,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ANEXOS WHATSAPP
CREATE TABLE IF NOT EXISTS public.whatsapp_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT REFERENCES public.whatsapp_messages(message_id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('image', 'audio', 'video', 'document', 'sticker', 'other')),
  mime_type TEXT,
  storage_path TEXT,
  public_url TEXT,
  file_size INTEGER,
  duration INTEGER,
  filename TEXT,
  sha256 TEXT,
  caption TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed')),
  download_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LOG DE AUDITORIA ADMIN
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_phone TEXT NOT NULL,
  actor_name TEXT,
  action_type TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb,
  result_status TEXT DEFAULT 'success' CHECK (result_status IN ('success', 'failed', 'partial')),
  result_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TAREFAS DO CENTRO DE COMANDO (complementar calendar_tasks)
CREATE TABLE IF NOT EXISTS public.command_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'cancelled')),
  priority TEXT DEFAULT 'med' CHECK (priority IN ('low', 'med', 'high', 'urgent')),
  due_date DATE,
  owner TEXT DEFAULT 'Team',
  source TEXT DEFAULT 'ui' CHECK (source IN ('whatsapp_command', 'ui', 'import', 'system')),
  related_conversation_id UUID REFERENCES public.whatsapp_conversations(id),
  related_attachment_id UUID REFERENCES public.whatsapp_attachments(id),
  tags JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LANÇAMENTOS FINANCEIROS DO CENTRO DE COMANDO
CREATE TABLE IF NOT EXISTS public.command_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('payable', 'receivable', 'expense', 'income')),
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  date DATE DEFAULT CURRENT_DATE,
  counterparty TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'cancelled')),
  tags JSONB DEFAULT '[]'::jsonb,
  source TEXT DEFAULT 'ui' CHECK (source IN ('whatsapp_command', 'ui', 'import', 'system')),
  related_conversation_id UUID REFERENCES public.whatsapp_conversations(id),
  related_attachment_id UUID REFERENCES public.whatsapp_attachments(id),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DIAGNÓSTICO DO WEBHOOK
CREATE TABLE IF NOT EXISTS public.webhook_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'received',
  payload_size INTEGER,
  processing_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON public.whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_session_mode ON public.whatsapp_conversations(session_mode);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON public.whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_attachments_conversation ON public.whatsapp_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_attachments_type ON public.whatsapp_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_command_tasks_status ON public.command_tasks(status);
CREATE INDEX IF NOT EXISTS idx_command_finance_date ON public.command_finance(date);

-- ENABLE RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_diagnostics ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Owner/Admin only)
CREATE POLICY "Admin manages whatsapp_conversations" ON public.whatsapp_conversations FOR ALL USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin manages whatsapp_messages" ON public.whatsapp_messages FOR ALL USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin manages whatsapp_attachments" ON public.whatsapp_attachments FOR ALL USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin manages admin_audit_log" ON public.admin_audit_log FOR ALL USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin manages command_tasks" ON public.command_tasks FOR ALL USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin manages command_finance" ON public.command_finance FOR ALL USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin manages webhook_diagnostics" ON public.webhook_diagnostics FOR ALL USING (is_admin_or_owner(auth.uid()));

-- Service role pode inserir (para o webhook)
CREATE POLICY "Service inserts whatsapp_conversations" ON public.whatsapp_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service inserts whatsapp_messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service inserts whatsapp_attachments" ON public.whatsapp_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service inserts admin_audit_log" ON public.admin_audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Service inserts command_tasks" ON public.command_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Service inserts command_finance" ON public.command_finance FOR INSERT WITH CHECK (true);
CREATE POLICY "Service inserts webhook_diagnostics" ON public.webhook_diagnostics FOR INSERT WITH CHECK (true);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_attachments;

-- STORAGE BUCKET para anexos WhatsApp
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('whatsapp-attachments', 'whatsapp-attachments', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admin manages whatsapp attachments" ON storage.objects FOR ALL USING (bucket_id = 'whatsapp-attachments' AND is_admin_or_owner(auth.uid()));
CREATE POLICY "Service uploads whatsapp attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'whatsapp-attachments');