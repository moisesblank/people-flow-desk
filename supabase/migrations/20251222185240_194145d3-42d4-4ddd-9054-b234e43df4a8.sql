-- ============================================
-- 🔒 LEI IV SNA OMEGA v5.1 - ATUALIZAÇÃO MATRIZ URLs
-- MAPA DEFINITIVO DE ACESSO (2024-12-22)
-- ============================================

-- 1. Atualizar função de validação de URL com novas regras
CREATE OR REPLACE FUNCTION public.can_access_url_v5(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
    v_role TEXT := public.get_user_role_v2(p_user_id);
    v_email TEXT;
BEGIN
    -- Buscar email do usuário
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
    
    -- 👑 OWNER (moisesblank@gmail.com) = ACESSO TOTAL SUPREMO
    IF v_role = 'owner' OR LOWER(v_email) = 'moisesblank@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- 🔧 Admin acessa quase tudo (exceto permissões críticas)
    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- 🌐 Rotas públicas (NÃO PAGANTE + qualquer cadastrado)
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/comunidade', '/area-gratuita', '/site', '/login', '/registro') THEN
        RETURN TRUE;
    END IF;
    
    -- 🌐 /comunidade acessível por TODOS cadastrados (gratuito + beta + funcionário)
    IF p_url LIKE '/comunidade%' THEN
        RETURN p_user_id IS NOT NULL; -- Apenas precisa estar logado
    END IF;
    
    -- 👨‍🎓 BETA (aluno PAGANTE) - acessa /alunos/* E /comunidade
    IF v_role = 'beta' THEN
        IF p_url LIKE '/alunos%' OR p_url LIKE '%/alunos%' OR p_url LIKE '/comunidade%' THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    -- 👔 Funcionário - acessa gestão (NÃO acessa /alunos/*)
    IF v_role = 'funcionario' THEN
        IF p_url LIKE '/alunos%' THEN
            RETURN FALSE;
        END IF;
        RETURN TRUE;
    END IF;
    
    -- 🌐 Aluno gratuito - apenas rotas públicas + comunidade
    IF v_role = 'aluno_gratuito' THEN
        IF p_url LIKE '/comunidade%' THEN
            RETURN TRUE;
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Viewer/anonymous - apenas rotas públicas já checadas acima
    RETURN FALSE;
END;
$$;

-- 2. Função de validação completa por hostname
CREATE OR REPLACE FUNCTION public.validate_url_access_v3(
    p_url TEXT, 
    p_hostname TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    required_role TEXT,
    user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
    v_role TEXT := public.get_user_role_v2(p_user_id);
    v_email TEXT;
    v_is_gestao BOOLEAN := p_hostname LIKE '%gestao.%';
    v_is_pro BOOLEAN := p_hostname LIKE '%pro.%';
BEGIN
    -- Buscar email
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

    -- 👑 OWNER (moisesblank@gmail.com) tem acesso TOTAL
    IF v_role = 'owner' OR LOWER(v_email) = 'moisesblank@gmail.com' THEN
        RETURN QUERY SELECT TRUE, '👑 OWNER - Acesso MASTER Total'::TEXT, NULL::TEXT, v_role;
        RETURN;
    END IF;
    
    -- Rotas públicas
    IF p_url IN ('/', '/auth', '/termos', '/privacidade', '/area-gratuita', '/site', '/login', '/registro') THEN
        RETURN QUERY SELECT TRUE, '🌐 Rota pública'::TEXT, NULL::TEXT, v_role;
        RETURN;
    END IF;
    
    -- /comunidade - acessível por qualquer cadastrado
    IF p_url LIKE '/comunidade%' THEN
        IF p_user_id IS NOT NULL THEN
            RETURN QUERY SELECT TRUE, '🌐 Comunidade - Acesso liberado'::TEXT, NULL::TEXT, v_role;
        ELSE
            RETURN QUERY SELECT FALSE, '🔒 Comunidade requer cadastro'::TEXT, 'aluno_gratuito'::TEXT, v_role;
        END IF;
        RETURN;
    END IF;
    
    -- gestao.* requer funcionário+
    IF v_is_gestao AND v_role NOT IN ('funcionario', 'admin', 'coordenacao', 'suporte', 'monitoria', 'marketing', 'contabilidade') THEN
        RETURN QUERY SELECT FALSE, '👔 Área de Gestão requer role funcionário'::TEXT, 'funcionario'::TEXT, v_role;
        RETURN;
    END IF;
    
    -- Rotas /alunos/* requerem beta (ou owner/admin)
    IF p_url LIKE '/alunos%' AND v_role NOT IN ('beta', 'admin') THEN
        RETURN QUERY SELECT FALSE, '👨‍🎓 Área do Aluno requer role beta (pagante)'::TEXT, 'beta'::TEXT, v_role;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT TRUE, '✅ Acesso permitido'::TEXT, NULL::TEXT, v_role;
END;
$$;

-- 3. Comentários atualizados
COMMENT ON FUNCTION public.can_access_url_v5 IS '🔒 LEI IV SNA v5.1 - Validação de URL. Owner=Total, Beta=/alunos+comunidade, Gratuito=comunidade';
COMMENT ON FUNCTION public.validate_url_access_v3 IS '🔒 LEI IV SNA v5.1 - Validação completa por hostname com reason e required_role';