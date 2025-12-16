-- ========================================================================
-- TABELA DE LEADS DO WHATSAPP (ManyChat + TRAMON)
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT, -- ID do ManyChat
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp_manychat', -- whatsapp_manychat, whatsapp_direct, instagram, site
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'interessado', 'matriculado', 'perdido')),
  last_contact TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_message TEXT,
  last_ai_response TEXT,
  contact_count INTEGER NOT NULL DEFAULT 1,
  tags TEXT[],
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_phone ON public.whatsapp_leads(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_status ON public.whatsapp_leads(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_last_contact ON public.whatsapp_leads(last_contact DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_source ON public.whatsapp_leads(source);

-- ========================================================================
-- HISTÓRICO DE CONVERSAS DOS LEADS
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.whatsapp_leads(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  processed_by TEXT DEFAULT 'tramon', -- tramon, manychat, humano
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_history_lead ON public.whatsapp_conversation_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_history_created ON public.whatsapp_conversation_history(created_at DESC);

-- ========================================================================
-- RLS POLICIES
-- ========================================================================

ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_history ENABLE ROW LEVEL SECURITY;

-- Apenas owner e admin podem ver leads
CREATE POLICY "Leads visíveis para owner e admin" ON public.whatsapp_leads
  FOR SELECT USING (
    public.is_admin_or_owner(auth.uid())
  );

CREATE POLICY "Leads editáveis por owner e admin" ON public.whatsapp_leads
  FOR ALL USING (
    public.is_admin_or_owner(auth.uid())
  );

-- Histórico de conversas
CREATE POLICY "Histórico visível para owner e admin" ON public.whatsapp_conversation_history
  FOR SELECT USING (
    public.is_admin_or_owner(auth.uid())
  );

CREATE POLICY "Histórico editável por owner e admin" ON public.whatsapp_conversation_history
  FOR ALL USING (
    public.is_admin_or_owner(auth.uid())
  );

-- Service role para o webhook
CREATE POLICY "Service role pode inserir leads" ON public.whatsapp_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role pode atualizar leads" ON public.whatsapp_leads
  FOR UPDATE USING (true);

CREATE POLICY "Service role pode inserir histórico" ON public.whatsapp_conversation_history
  FOR INSERT WITH CHECK (true);

-- ========================================================================
-- TRIGGER PARA UPDATED_AT
-- ========================================================================

CREATE TRIGGER update_whatsapp_leads_updated_at
  BEFORE UPDATE ON public.whatsapp_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================================================
-- FUNÇÃO PARA SALVAR/ATUALIZAR LEAD
-- ========================================================================

CREATE OR REPLACE FUNCTION public.upsert_whatsapp_lead(
  p_phone TEXT,
  p_name TEXT,
  p_external_id TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_ai_response TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'whatsapp_manychat'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  -- Verificar se lead já existe pelo telefone
  SELECT id INTO v_lead_id
  FROM public.whatsapp_leads
  WHERE phone = p_phone
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    -- Atualizar lead existente
    UPDATE public.whatsapp_leads
    SET 
      last_contact = NOW(),
      last_message = COALESCE(p_message, last_message),
      last_ai_response = COALESCE(p_ai_response, last_ai_response),
      contact_count = contact_count + 1,
      updated_at = NOW()
    WHERE id = v_lead_id;
  ELSE
    -- Criar novo lead
    INSERT INTO public.whatsapp_leads (external_id, name, phone, source, last_message, last_ai_response)
    VALUES (p_external_id, p_name, p_phone, p_source, p_message, p_ai_response)
    RETURNING id INTO v_lead_id;
  END IF;

  -- Salvar no histórico se houver mensagem
  IF p_message IS NOT NULL AND p_ai_response IS NOT NULL THEN
    INSERT INTO public.whatsapp_conversation_history (lead_id, user_message, ai_response)
    VALUES (v_lead_id, p_message, p_ai_response);
  END IF;

  RETURN v_lead_id;
END;
$$;

-- ========================================================================
-- VIEW PARA DASHBOARD DE LEADS
-- ========================================================================

CREATE OR REPLACE VIEW public.whatsapp_leads_dashboard AS
SELECT 
  wl.*,
  (SELECT COUNT(*) FROM public.whatsapp_conversation_history wch WHERE wch.lead_id = wl.id) as total_messages,
  (SELECT MAX(created_at) FROM public.whatsapp_conversation_history wch WHERE wch.lead_id = wl.id) as last_interaction
FROM public.whatsapp_leads wl
ORDER BY wl.last_contact DESC;