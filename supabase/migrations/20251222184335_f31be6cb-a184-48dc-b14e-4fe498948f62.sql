-- =====================================================
-- 🛡️ MIGRAÇÃO DE SEGURANÇA v5.0
-- Correção de warnings do linter + Otimizações
-- =====================================================

-- 1. Atualizar função can_access_url para incluir /comunidade
CREATE OR REPLACE FUNCTION public.can_access_url_v4(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
    v_role TEXT := public.get_user_role_v2(p_user_id);
BEGIN
    -- Owner acessa TUDO
    IF v_role = 'owner' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin acessa quase tudo
    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Rotas públicas (permitidas para todos)
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/comunidade', '/area-gratuita', '/site') THEN
        RETURN TRUE;
    END IF;
    
    -- Beta (aluno pagante) - acessa /alunos/*
    IF v_role = 'beta' THEN
        IF p_url LIKE '/alunos%' OR p_url LIKE '%/alunos%' THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Funcionário - acessa gestão
    IF v_role = 'funcionario' THEN
        IF p_url LIKE '/alunos%' THEN
            RETURN FALSE;
        END IF;
        RETURN TRUE;
    END IF;
    
    -- Aluno gratuito / viewer - apenas rotas públicas já checadas acima
    RETURN FALSE;
END;
$$;

-- 2. Função de validação de URL por hostname
CREATE OR REPLACE FUNCTION public.validate_url_access_v2(
    p_url TEXT, 
    p_hostname TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    required_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
    v_role TEXT := public.get_user_role_v2(p_user_id);
    v_is_gestao BOOLEAN := p_hostname LIKE '%gestao.%';
    v_is_pro BOOLEAN := p_hostname LIKE '%pro.%';
BEGIN
    -- Owner tem acesso a TUDO
    IF v_role = 'owner' THEN
        RETURN QUERY SELECT TRUE, 'OWNER - Acesso Total'::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Rotas públicas
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/comunidade', '/area-gratuita', '/site') THEN
        RETURN QUERY SELECT TRUE, 'Rota pública'::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Gestão requer funcionário+
    IF v_is_gestao AND v_role NOT IN ('funcionario', 'admin') THEN
        RETURN QUERY SELECT FALSE, 'Área de Gestão requer role funcionário ou superior'::TEXT, 'funcionario'::TEXT;
        RETURN;
    END IF;
    
    -- Rotas /alunos/* requerem beta
    IF p_url LIKE '/alunos%' AND v_role NOT IN ('beta', 'funcionario', 'admin') THEN
        RETURN QUERY SELECT FALSE, 'Área do Aluno requer role beta ou superior'::TEXT, 'beta'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Acesso permitido'::TEXT, NULL::TEXT;
END;
$$;

-- 3. Índice para otimizar consultas de URL
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role);

-- 4. Índice para profiles access_expires_at (verificação de beta)
CREATE INDEX IF NOT EXISTS idx_profiles_access_expires 
ON public.profiles(id, access_expires_at) 
WHERE access_expires_at IS NOT NULL;

-- 5. Comentários para documentação
COMMENT ON FUNCTION public.can_access_url_v4 IS '🔒 LEI IV SNA - Validação de acesso a URLs por role. Inclui /comunidade como rota pública.';
COMMENT ON FUNCTION public.validate_url_access_v2 IS '🔒 LEI IV SNA - Validação completa de URL por hostname, retorna reason e required_role.';