-- ============================================
-- 🔥 DOGMA V: CRIPTOGRAFIA COM PGSODIUM
-- Dados sensíveis criptografados em repouso
-- ============================================

-- Habilitar extensão pgsodium para criptografia
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- ============================================
-- TABELA PARA TOKENS E CHAVES CRIPTOGRAFADAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.encrypted_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_name TEXT NOT NULL,
  encrypted_value BYTEA NOT NULL,
  nonce BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, secret_name)
);

-- RLS para secrets criptografados
ALTER TABLE public.encrypted_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só acessam seus próprios secrets"
ON public.encrypted_secrets FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- TABELA PARA URLs ASSINADAS DE VÍDEO
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_signed_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 1,
  ip_address INET,
  user_agent TEXT
);

-- RLS para URLs assinadas
ALTER TABLE public.video_signed_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só acessam suas próprias URLs assinadas"
ON public.video_signed_urls FOR ALL
USING (auth.uid() = user_id);

-- Índice para expiração
CREATE INDEX idx_video_signed_urls_expires ON public.video_signed_urls(expires_at);
CREATE INDEX idx_video_signed_urls_video ON public.video_signed_urls(video_id, user_id);

-- ============================================
-- TABELA DE LOG DE ACESSO A CONTEÚDO
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL, -- 'video', 'pdf', 'material'
  content_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'view', 'download_attempt', 'share_attempt'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  blocked_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS - admins podem ver tudo, usuários só os próprios logs
ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios logs de acesso"
ON public.content_access_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir logs"
ON public.content_access_log FOR INSERT
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_content_access_log_user ON public.content_access_log(user_id);
CREATE INDEX idx_content_access_log_content ON public.content_access_log(content_type, content_id);
CREATE INDEX idx_content_access_log_created ON public.content_access_log(created_at DESC);

-- ============================================
-- FUNÇÃO PARA GERAR URL ASSINADA (5 minutos)
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_signed_video_url(
  p_video_id TEXT,
  p_expires_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_signed_url TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result_id UUID;
BEGIN
  -- Verificar autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Calcular expiração
  v_expires_at := now() + (p_expires_minutes || ' minutes')::INTERVAL;
  
  -- Gerar token único para a URL (será processado pela Edge Function)
  v_signed_url := encode(gen_random_bytes(32), 'hex');
  
  -- Inserir registro
  INSERT INTO public.video_signed_urls (
    video_id, user_id, signed_url, expires_at
  ) VALUES (
    p_video_id, v_user_id, v_signed_url, v_expires_at
  )
  RETURNING id INTO v_result_id;
  
  -- Logar acesso
  INSERT INTO public.content_access_log (
    user_id, content_type, content_id, action, metadata
  ) VALUES (
    v_user_id, 'video', p_video_id, 'view', 
    jsonb_build_object('signed_url_id', v_result_id)
  );
  
  RETURN jsonb_build_object(
    'id', v_result_id,
    'token', v_signed_url,
    'expires_at', v_expires_at,
    'video_id', p_video_id
  );
END;
$$;

-- ============================================
-- FUNÇÃO PARA VALIDAR URL ASSINADA
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_signed_video_url(
  p_token TEXT,
  p_video_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN;
  v_url_id UUID;
BEGIN
  SELECT id INTO v_url_id
  FROM public.video_signed_urls
  WHERE signed_url = p_token
    AND video_id = p_video_id
    AND expires_at > now()
    AND (used_count < max_uses OR max_uses IS NULL);
  
  v_valid := v_url_id IS NOT NULL;
  
  IF v_valid THEN
    -- Incrementar contador de uso
    UPDATE public.video_signed_urls
    SET used_count = used_count + 1
    WHERE id = v_url_id;
  END IF;
  
  RETURN v_valid;
END;
$$;

-- ============================================
-- FUNÇÃO PARA LIMPAR URLs EXPIRADAS
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_signed_urls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.video_signed_urls
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;