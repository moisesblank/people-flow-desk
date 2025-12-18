-- Primeiro dropar a função antiga
DROP FUNCTION IF EXISTS public.upsert_whatsapp_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Recriar função com parâmetro p_nome em vez de p_name
CREATE OR REPLACE FUNCTION public.upsert_whatsapp_lead(
  p_phone TEXT,
  p_nome TEXT,
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
    INSERT INTO public.whatsapp_leads (external_id, nome, phone, source, last_message, last_ai_response)
    VALUES (p_external_id, p_nome, p_phone, p_source, p_message, p_ai_response)
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

-- Atualizar view para usar 'nome' em vez de 'name'
DROP VIEW IF EXISTS public.whatsapp_leads_dashboard;
CREATE VIEW public.whatsapp_leads_dashboard 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  nome,
  phone,
  source,
  status,
  last_contact,
  contact_count,
  created_at
FROM public.whatsapp_leads
ORDER BY last_contact DESC;