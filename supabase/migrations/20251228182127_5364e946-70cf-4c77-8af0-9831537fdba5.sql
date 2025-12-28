-- A tabela password_reset_tokens é acessada APENAS por funções SECURITY DEFINER
-- Nenhuma política RLS é necessária porque nenhum acesso direto é permitido
-- Esta é uma política explícita de DENY ALL para documentar a intenção

-- Comentário de documentação (a ausência de policies + RLS enabled = deny all, que é o desejado)
COMMENT ON TABLE public.password_reset_tokens IS 'Tokens de reset de senha. Acesso APENAS via funções SECURITY DEFINER. RLS enabled + no policies = deny all direct access (intencional).';