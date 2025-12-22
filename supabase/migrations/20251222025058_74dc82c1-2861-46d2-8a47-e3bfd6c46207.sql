-- Índice para verificar última mensagem do usuário (rate-limit)
CREATE INDEX IF NOT EXISTS idx_live_chat_user_rate_limit 
ON public.live_chat_messages (user_id, live_id, created_at DESC);

-- Índice para mensagens destacadas
CREATE INDEX IF NOT EXISTS idx_live_chat_highlighted 
ON public.live_chat_messages (live_id, is_highlighted) 
WHERE is_highlighted = true;

-- Função para verificar rate-limit do chat (1 msg a cada 2 segundos)
CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(
  p_user_id UUID,
  p_live_id UUID,
  p_interval_seconds INTEGER DEFAULT 2
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_message TIMESTAMPTZ;
BEGIN
  SELECT created_at INTO v_last_message
  FROM public.live_chat_messages
  WHERE user_id = p_user_id AND live_id = p_live_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_last_message IS NULL THEN
    RETURN TRUE;
  END IF;
  
  IF NOW() - v_last_message < (p_interval_seconds || ' seconds')::INTERVAL THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Função para enviar mensagem com rate-limit
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_live_id UUID,
  p_message TEXT,
  p_user_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_message_id UUID;
  v_user_name TEXT;
  v_avatar_url TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar rate-limit (1 msg/2s)
  IF NOT public.check_chat_rate_limit(v_user_id, p_live_id, 2) THEN
    RAISE EXCEPTION 'Aguarde 2 segundos entre mensagens';
  END IF;
  
  -- Buscar dados do usuário se não fornecidos
  IF p_user_name IS NULL THEN
    SELECT nome, avatar_url INTO v_user_name, v_avatar_url
    FROM public.profiles
    WHERE id = v_user_id;
  ELSE
    v_user_name := p_user_name;
    v_avatar_url := p_avatar_url;
  END IF;
  
  -- Inserir mensagem
  INSERT INTO public.live_chat_messages (
    live_id, user_id, user_name, avatar_url, message
  ) VALUES (
    p_live_id, v_user_id, COALESCE(v_user_name, 'Anônimo'), v_avatar_url, p_message
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;