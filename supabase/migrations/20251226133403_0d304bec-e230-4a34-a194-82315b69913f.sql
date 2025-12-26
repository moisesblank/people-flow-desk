-- 🛡️ P1.2 FIX: validate_signed_video_url agora verifica user_id
-- Primeiro dropar a versão antiga com assinatura (TEXT, TEXT)

DROP FUNCTION IF EXISTS public.validate_signed_video_url(TEXT, TEXT);

-- Recriar com nova assinatura que inclui p_user_id opcional
CREATE OR REPLACE FUNCTION public.validate_signed_video_url(
  p_token TEXT,
  p_video_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN;
  v_url_id UUID;
  v_token_user_id UUID;
BEGIN
  -- Buscar URL válida
  SELECT id, user_id INTO v_url_id, v_token_user_id
  FROM public.video_signed_urls
  WHERE signed_url = p_token
    AND video_id = p_video_id
    AND expires_at > now()
    AND (used_count < max_uses OR max_uses IS NULL);
  
  v_valid := v_url_id IS NOT NULL;
  
  -- 🛡️ SEGURANÇA: Se p_user_id foi fornecido, verificar se o token pertence a esse usuário
  -- Isso previne DoS lógico onde alguém consome usos de tokens de outros
  IF v_valid AND p_user_id IS NOT NULL AND v_token_user_id IS NOT NULL THEN
    IF v_token_user_id != p_user_id THEN
      -- Token não pertence a este usuário - logar tentativa suspeita
      INSERT INTO public.security_events (event_type, severity, description, payload)
      VALUES (
        'VIDEO_TOKEN_USER_MISMATCH',
        'warning',
        'Tentativa de usar token de vídeo de outro usuário',
        jsonb_build_object(
          'token_user_id', v_token_user_id,
          'requesting_user_id', p_user_id,
          'video_id', p_video_id
        )
      );
      
      RETURN FALSE;
    END IF;
  END IF;
  
  IF v_valid THEN
    -- Incrementar contador de uso
    UPDATE public.video_signed_urls
    SET used_count = used_count + 1
    WHERE id = v_url_id;
  END IF;
  
  RETURN v_valid;
END;
$$;

COMMENT ON FUNCTION public.validate_signed_video_url(TEXT, TEXT, UUID) IS 'Valida URL assinada de vídeo com proteção contra uso indevido por outros usuários (P1.2 FIX)';