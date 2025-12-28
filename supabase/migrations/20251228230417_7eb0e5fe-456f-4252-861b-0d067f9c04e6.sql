-- ============================================
-- UNIFICAÇÃO: user_roles.expires_at é a ÚNICA fonte de verdade
-- profiles.access_expires_at será DEPRECATED (mantido para compatibilidade)
-- ============================================

-- 1. Atualizar função check_beta_access para usar user_roles.expires_at
CREATE OR REPLACE FUNCTION public.check_beta_access(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_expires_at TIMESTAMPTZ;
    v_days_remaining INT;
BEGIN
    -- Buscar role e expires_at de user_roles (FONTE ÚNICA)
    SELECT role, expires_at INTO v_role, v_expires_at 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    LIMIT 1;
    
    -- Owner/Admin = acesso ilimitado
    IF v_role IN ('owner', 'admin') THEN
        RETURN json_build_object(
            'has_access', TRUE, 
            'is_unlimited', TRUE, 
            'role', v_role,
            'expires_at', NULL,
            'days_remaining', NULL
        );
    END IF;
    
    -- Roles premium: beta, aluno_presencial, beta_expira
    IF v_role IN ('beta', 'aluno_presencial', 'beta_expira') THEN
        -- beta_expira tem expires_at obrigatório
        -- beta e aluno_presencial NÃO têm expires_at (acesso permanente)
        IF v_role = 'beta_expira' AND v_expires_at IS NOT NULL THEN
            IF v_expires_at > NOW() THEN
                v_days_remaining := EXTRACT(DAY FROM v_expires_at - NOW())::INT;
                RETURN json_build_object(
                    'has_access', TRUE,
                    'is_unlimited', FALSE,
                    'role', v_role,
                    'expires_at', v_expires_at,
                    'days_remaining', v_days_remaining
                );
            ELSE
                -- Expirado
                RETURN json_build_object(
                    'has_access', FALSE,
                    'is_unlimited', FALSE,
                    'role', v_role,
                    'expires_at', v_expires_at,
                    'days_remaining', 0,
                    'reason', 'expired'
                );
            END IF;
        ELSE
            -- beta e aluno_presencial = acesso permanente
            RETURN json_build_object(
                'has_access', TRUE,
                'is_unlimited', TRUE,
                'role', v_role,
                'expires_at', NULL,
                'days_remaining', NULL
            );
        END IF;
    END IF;
    
    -- aluno_gratuito = sem acesso premium
    IF v_role = 'aluno_gratuito' THEN
        RETURN json_build_object(
            'has_access', FALSE,
            'is_unlimited', FALSE,
            'role', v_role,
            'reason', 'free_tier'
        );
    END IF;
    
    -- Sem role = sem acesso
    RETURN json_build_object(
        'has_access', FALSE,
        'is_unlimited', FALSE,
        'role', NULL,
        'reason', 'no_role'
    );
END;
$$;

-- 2. Atualizar função can_access_sanctuary para usar user_roles.expires_at
CREATE OR REPLACE FUNCTION public.can_access_sanctuary(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Buscar role e expires_at de user_roles (FONTE ÚNICA)
    SELECT role, expires_at INTO v_role, v_expires_at 
    FROM public.user_roles 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Owner/Admin = sempre pode
    IF v_role IN ('owner', 'admin') THEN 
        RETURN TRUE; 
    END IF;
    
    -- Roles premium
    IF v_role IN ('beta', 'aluno_presencial', 'beta_expira') THEN
        -- beta e aluno_presencial = permanente
        IF v_role IN ('beta', 'aluno_presencial') THEN
            RETURN TRUE;
        END IF;
        -- beta_expira = verificar expiração
        IF v_role = 'beta_expira' THEN
            IF v_expires_at IS NULL OR v_expires_at > NOW() THEN 
                RETURN TRUE; 
            END IF;
        END IF;
    END IF;
    
    -- Sem acesso
    RETURN FALSE;
END;
$$;

-- 3. Criar VIEW para expor expires_at de forma unificada (para frontend)
CREATE OR REPLACE VIEW public.user_access_status AS
SELECT 
    ur.user_id,
    ur.role,
    ur.expires_at,
    CASE 
        WHEN ur.role IN ('owner', 'admin', 'beta', 'aluno_presencial') THEN TRUE
        WHEN ur.role = 'beta_expira' AND (ur.expires_at IS NULL OR ur.expires_at > NOW()) THEN TRUE
        ELSE FALSE
    END as has_premium_access,
    CASE 
        WHEN ur.role = 'beta_expira' AND ur.expires_at IS NOT NULL THEN 
            GREATEST(0, EXTRACT(DAY FROM ur.expires_at - NOW())::INT)
        ELSE NULL
    END as days_remaining,
    p.nome,
    p.email,
    p.avatar_url
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id;

-- 4. Adicionar comentário de deprecation em profiles.access_expires_at
COMMENT ON COLUMN public.profiles.access_expires_at IS 
'DEPRECATED v10.x: Use user_roles.expires_at como fonte da verdade. Este campo será removido em versão futura.';

-- 5. Índice para busca rápida de expiração em user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at 
ON public.user_roles(expires_at) 
WHERE expires_at IS NOT NULL;