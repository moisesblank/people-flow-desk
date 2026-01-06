
-- ============================================
-- TABELA: first_access_tokens
-- Tokens de primeiro acesso que NÃO expiram até serem usados
-- ============================================

CREATE TABLE IF NOT EXISTS public.first_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_first_access_tokens_token ON public.first_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_first_access_tokens_user_id ON public.first_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_first_access_tokens_email ON public.first_access_tokens(email);

-- RLS: Apenas o próprio usuário pode ver seu token (via validação server-side)
ALTER TABLE public.first_access_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Ninguém pode acessar diretamente (apenas via Edge Functions com service role)
CREATE POLICY "No direct access - use edge functions"
ON public.first_access_tokens
FOR ALL
USING (false);

-- Comentário explicativo
COMMENT ON TABLE public.first_access_tokens IS 'Tokens de primeiro acesso que NÃO expiram até serem usados. Substitui magic links que expiram em 1 hora.';
